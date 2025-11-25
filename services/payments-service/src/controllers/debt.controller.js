const debtService = require('../services/debt.service');

async function createSimpleDebt(req, res) {
  try {
    const { creditorId, debtorId, amount } = req.body;
    // allow header injected auth
    const auth = req.headers && req.headers['x-user-id'];
    // if creditorId missing, assume authenticated user lent money
    const cred = creditorId || auth;
    if (!cred) return res.status(400).json({ success: false, error: 'creditorId required' });
    if (!debtorId) return res.status(400).json({ success: false, error: 'debtorId required' });
    const r = await debtService.createSimpleDebt({ creditorId: cred, debtorId, amount });
    return res.status(201).json({ success: true, debt: r });
  } catch (e) {
    console.error('createSimpleDebt', e);
    return res.status(400).json({ success: false, error: e.message });
  }
}

async function recordSplitPayment(req, res) {
  try {
    const { payerId, participants, totalAmount } = req.body;
    const auth = req.headers && req.headers['x-user-id'];
    const payer = payerId || auth;
    const r = await debtService.recordSplitPayment({ payerId: payer, participants, totalAmount });
    return res.status(201).json({ success: true, result: r });
  } catch (e) {
    console.error('recordSplitPayment', e);
    return res.status(400).json({ success: false, error: e.message });
  }
}

async function recordGroupPayment(req, res) {
  try {
    const { payerId, groupId, totalAmount, shares } = req.body;
    const auth = req.headers && req.headers['x-user-id'];
    const payer = payerId || auth;
    const r = await debtService.recordGroupPayment({ payerId: payer, groupId, totalAmount, shares });
    return res.status(201).json({ success: true, result: r });
  } catch (e) {
    console.error('recordGroupPayment', e);
    return res.status(400).json({ success: false, error: e.message });
  }
}

async function getPersonBalance(req, res) {
  try {
    const userA = req.params.userA || (req.headers && req.headers['x-user-id']);
    const userB = req.params.userB;
    if (!userA || !userB) return res.status(400).json({ success: false, error: 'userA and userB required' });
    const r = await debtService.getBalanceBetween(userA, userB);
    return res.json({ success: true, balance: r });
  } catch (e) {
    console.error('getPersonBalance', e);
    return res.status(500).json({ success: false, error: 'Fetch failed' });
  }
}

async function getGroupBalances(req, res) {
  try {
    const groupId = req.params.groupId;
    const userId = req.params.userId || (req.headers && req.headers['x-user-id']);
    if (!groupId || !userId) return res.status(400).json({ success: false, error: 'groupId and userId required' });
    const r = await debtService.getGroupBalances(groupId, userId);
    return res.json({ success: true, balances: r });
  } catch (e) {
    console.error('getGroupBalances', e);
    return res.status(500).json({ success: false, error: 'Fetch failed' });
  }
}

module.exports = { createSimpleDebt, recordSplitPayment, recordGroupPayment, getPersonBalance, getGroupBalances };
