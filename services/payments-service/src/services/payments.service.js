const paymentsRepo = require('../repositories/payments.repository');

async function recordPayment({ payerId, participants, amount, currency, description, groupId }) {
  // basic validation
  if (!payerId) throw new Error('payerId required');
  if (!participants || !Array.isArray(participants) || participants.length === 0) throw new Error('participants required');
  if (!amount || Number(amount) <= 0) throw new Error('amount must be > 0');

  // persist
  const payment = await paymentsRepo.createPayment({ payerId, participants, amount, currency, description, groupId });
  return payment;
}

async function listPaymentsForUser(userId) {
  return paymentsRepo.getPaymentsForUser(userId);
}

async function listPaymentsForGroup(groupId) {
  return paymentsRepo.getPaymentsForGroup(groupId);
}

module.exports = { recordPayment, listPaymentsForUser, listPaymentsForGroup };
