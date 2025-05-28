// Controller for payment-related business logic
// Handles payment creation and retrieval for tenants and landlords
// Each exported function corresponds to a route in routes/payments.js
//
// Example usage:
//   POST /api/payments (tenant only)
//   GET /api/payments (all users)
//
// See comments in each function for details.

const Payment = require('../models/Payment');
const Lease = require('../models/Lease');
const { v4: uuidv4 } = require('uuid');

exports.createPayment = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can make payments' });
  }

  const { lease_id, amount } = req.body;

  if (!lease_id || !amount) {
    return res.status(400).json({ message: 'Lease ID and amount are required' });
  }

  try {
    const lease = await Lease.findById(lease_id);
    if (!lease || lease.tenant_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Lease not found or not authorized' });
    }

    const payment = await Payment.create({
      lease_id,
      tenant_id: req.user._id,
      amount,
      transaction_id: uuidv4(),
      status: 'completed' // Mock payment success
    });

    res.status(201).json({ message: 'Payment processed', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const query = req.user.role === 'tenant' ? { tenant_id: req.user._id } : { lease_id: { $in: await Lease.find({ property_id: { $in: await Property.find({ landlord_id: req.user._id }).select('_id') } }).select('_id') } };
    const payments = await Payment.find(query).populate('lease_id', 'start_date end_date');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};