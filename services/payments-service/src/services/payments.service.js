const paymentsRepo = require('../repositories/payments.repository');
const debtService = require('./debt.service');
const { sendNotification } = require('../notifications/sendNotification');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recordPayment({ payerId, participants, amount, currency, description, groupId }) {
  // basic validation
  if (!payerId) throw new Error('payerId required');
  if (!participants || !Array.isArray(participants) || participants.length === 0) throw new Error('participants required');
  if (!amount || Number(amount) <= 0) throw new Error('amount must be > 0');

  // persist payment first
  const payment = await paymentsRepo.createPayment({ payerId, participants, amount, currency, description, groupId });

  // Now update debts accordingly. We attempt to roll back the payment if debt update fails.
  try {
    // normalize participants: participants may be array of ids or array of { userId, percent }
    let shares = null;
    const isObjectShares = participants.length > 0 && typeof participants[0] === 'object' && participants[0].userId;

    if (groupId) {
      // group payment: build shares array
      if (isObjectShares) {
        shares = participants.map(p => ({ userId: String(p.userId), percent: Number(p.percent || 0) }));
      } else {
        // equal split among participants
        const n = participants.length;
        const base = Math.floor(100 / n);
        const rem = 100 - base * n;
        shares = participants.map((u, idx) => ({ userId: String(isObjectShares ? u.userId : u), percent: base + (idx === 0 ? rem : 0) }));
      }
      await debtService.recordGroupPayment({ payerId, groupId, totalAmount: amount, shares });
    } else {
      // non-group payment: if participants are single id -> simple debt
      if (!isObjectShares) {
        const ids = participants.map(p => String(p));
        if (ids.length === 1) {
          // simple debt: payer is creditor, participant is debtor
          await debtService.createSimpleDebt({ creditorId: payerId, debtorId: ids[0], amount });
        } else {
          // split equally among participants
          const n = ids.length + 1; // including payer? existing code uses participants as those who owe payer; assume participants are those who owe
          // compute percent among participants (they owe payer)
          const base = Math.floor(100 / ids.length);
          const rem = 100 - base * ids.length;
          const parts = ids.map((u, idx) => ({ userId: u, percent: base + (idx === 0 ? rem : 0) }));
          await debtService.recordSplitPayment({ payerId, participants: parts, totalAmount: amount });
        }
      } else {
        // participants given with percents
        const parts = participants.map(p => ({ userId: String(p.userId), percent: Number(p.percent || 0) }));
        await debtService.recordSplitPayment({ payerId, participants: parts, totalAmount: amount });
      }
    }
  } catch (e) {
    // try rollback: delete payment record
    try {
      await prisma.payment.delete({ where: { id: payment.id } });
    } catch (delErr) {
      console.error('Failed to rollback payment after debt update failure', delErr);
    }
    throw e;
  }

  // send consolidated notification (non-blocking)
  try { await notifyParticipants(payment) } catch (e) { /* ignore notify errors */ }

  return payment;
}

// send a consolidated notification to all involved users
async function notifyParticipants(payment) {
  try {
    const payerId = String(payment.payerId);
    // participants may be stored as JSON; try to extract ids
    let ids = [];
    try {
      const p = payment.participants;
      if (Array.isArray(p)) {
        ids = p.map(x => (typeof x === 'object' ? String(x.userId || x) : String(x)));
      }
    } catch (e) { ids = [] }
    // include payer as a recipient as well (so they get a confirmation)
    const recipients = Array.from(new Set([payerId, ...ids].filter(Boolean)));

    const payload = {
      paymentId: payment.id,
      payerId,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      groupId: payment.groupId || null,
      recipients
    };

    // top-level notification type for payments
    sendNotification('PAYMENT_CREATED', payload);
  } catch (e) {
    console.debug('notifyParticipants failed', e && e.message ? e.message : e);
  }
}


async function listPaymentsForUser(userId) {
  return paymentsRepo.getPaymentsForUser(userId);
}

async function listPaymentsForGroup(groupId) {
  return paymentsRepo.getPaymentsForGroup(groupId);
}

module.exports = { recordPayment, listPaymentsForUser, listPaymentsForGroup, notifyParticipants };
