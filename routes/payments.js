// Payment Endpoints
// Handles payment subaccount creation, payment initialization, verification, payment creation, and retrieval
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPayment, getPayments, createSubaccount, initializePayment, verifyPayment } = require('../controllers/paymentController');

// POST /api/payments - Create a payment (Tenant only)
router.post('/', protect, createPayment);
// GET /api/payments - List payments for user
router.get('/', protect, getPayments);
// POST /api/payments/subaccount - Create a payment subaccount (Landlord only)
router.post('/subaccount', protect, createSubaccount);
// POST /api/payments/initialize - Initialize a payment transaction (Tenant only)
router.post('/initialize', protect, initializePayment);
// GET /api/payments/verify/:reference - Verify a payment by reference (Tenant only)
router.get('/verify/:reference', protect, verifyPayment);

module.exports = router;