const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/', protect, paymentController.createPayment);
router.get('/', protect, paymentController.getPayments);

module.exports = router;