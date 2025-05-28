// Payment Endpoints (Educational Stubs)
// These are placeholder endpoints for payment subaccount creation, payment initialization, and payment verification.
// Implement integration with a payment provider as needed.
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// POST /api/payments - Create a payment (Tenant only)
router.post('/', protect, paymentController.createPayment);
// GET /api/payments - List payments for user
router.get('/', protect, paymentController.getPayments);

// STUB: POST /api/payments/subaccount - Create a payment subaccount (for landlords)
router.post('/subaccount', protect, (req, res) => {
  // TODO: Integrate with payment provider to create subaccount
  res.status(501).json({ message: 'Not implemented: Create payment subaccount' });
});

// STUB: POST /api/payments/initialize - Initialize a payment transaction
router.post('/initialize', protect, (req, res) => {
  // TODO: Integrate with payment provider to initialize payment
  res.status(501).json({ message: 'Not implemented: Initialize payment' });
});

// STUB: GET /api/payments/verify/:reference - Verify a payment by reference
router.get('/verify/:reference', protect, (req, res) => {
  // TODO: Integrate with payment provider to verify payment
  res.status(501).json({ message: 'Not implemented: Verify payment' });
});

module.exports = router;