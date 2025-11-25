const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');

// POST /api/payments
router.post('/', paymentsController.createPayment);

// GET /api/payments/user/:userId
router.get('/user/:userId', paymentsController.getUserPayments);

// GET /api/payments/group/:groupId
router.get('/group/:groupId', paymentsController.getGroupPayments);

module.exports = router;
