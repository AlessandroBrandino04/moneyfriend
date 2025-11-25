const paymentsService = require('../services/payments.service');

async function createPayment(req, res) {
  try {
    let { payerId, participants, amount, currency, description, groupId } = req.body || {};
    // allow gateway to inject authenticated user id via header
    if (!payerId && req.headers && req.headers['x-user-id']) payerId = req.headers['x-user-id'];
    const saved = await paymentsService.recordPayment({ payerId, participants, amount, currency, description, groupId });
    return res.status(201).json({ success: true, payment: saved });
  } catch (e) {
    console.error('createPayment error', e);
    return res.status(400).json({ success: false, error: e.message });
  }
}

async function getUserPayments(req, res) {
  try {
    const userId = req.params.userId || (req.user && req.user.sub) || (req.headers && req.headers['x-user-id']);
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
    const list = await paymentsService.listPaymentsForUser(userId);
    return res.json({ success: true, payments: list });
  } catch (e) {
    console.error('getUserPayments error', e);
    return res.status(500).json({ success: false, error: 'Fetch failed' });
  }
}

async function getGroupPayments(req, res) {
  try {
    const groupId = req.params.groupId;
    if (!groupId) return res.status(400).json({ success: false, error: 'groupId required' });
    const list = await paymentsService.listPaymentsForGroup(groupId);
    return res.json({ success: true, payments: list });
  } catch (e) {
    console.error('getGroupPayments error', e);
    return res.status(500).json({ success: false, error: 'Fetch failed' });
  }
}

module.exports = { createPayment, getUserPayments, getGroupPayments };
