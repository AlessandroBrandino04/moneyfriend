const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debt.controller');

// Simple debt between two people
router.post('/simple', debtController.createSimpleDebt);

// Payment with percent split between participants (array of { userId, percent })
router.post('/split', debtController.recordSplitPayment);

// Group payment with per-person shares
router.post('/group-payment', debtController.recordGroupPayment);

// Get balance between two people (userA param optional uses authenticated header)
router.get('/person/:userB', debtController.getPersonBalance);
router.get('/person/:userA/:userB', debtController.getPersonBalance);

// Get group balances for a user (userId optional uses auth header)
router.get('/group/:groupId/:userId?', debtController.getGroupBalances);

module.exports = router;
