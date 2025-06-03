// Controller for payment-related business logic
// Handles payment creation, retrieval, subaccount creation, payment initialization, and verification for tenants and landlords
// Each exported function corresponds to a route in routes/payments.js
//
// Example usage:
//   POST /api/payments (tenant only)
//   GET /api/payments (all users)
//   POST /api/payments/subaccount (landlord only)
//   POST /api/payments/initialize (tenant only)
//   GET /api/payments/verify/:reference (tenant only)

const Payment = require('../models/Payment');
const Lease = require('../models/Lease');
const Property = require('../models/Property');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Paystack secret key from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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

exports.createSubaccount = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can create subaccounts' });
  }

  const { businessName, bankCode, accountNumber } = req.body;

  if (!businessName || !bankCode || !accountNumber) {
    return res.status(400).json({ message: 'Business name, bank code, and account number are required' });
  }

  try {
    const response = await axios.post(
      'https://api.paystack.co/subaccount',
      {
        business_name: businessName,
        bank_code: bankCode.toString(),
        account_number: accountNumber.toString(),
        percentage_charge: 10 // 10% transaction fee (adjust as needed)
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Optionally save subaccount ID to user
    req.user.paymentSubaccountId = response.data.data.subaccount_code;
    await req.user.save();

    res.status(201).json({
      message: 'Subaccount created successfully',
      subaccountId: response.data.data.subaccount_code
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create subaccount',
      error: error.response?.data?.message || error.message
    });
  }
};

exports.initializePayment = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can initialize payments' });
  }

  const { amount, lease_id } = req.body;

  if (!amount || !lease_id) {
    return res.status(400).json({ message: 'Amount and lease ID are required' });
  }

  try {
    const lease = await Lease.findById(lease_id);
    if (!lease || lease.tenant_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Lease not found or not authorized' });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email,
        amount: amount * 100, // Paystack uses kobo
        callback_url: 'https://pms-bd.onrender.com/api/payments/verify',
        metadata: { lease_id }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({
      message: 'Payment initialized',
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to initialize payment',
      error: error.response?.data?.message || error.message
    });
  }
};

exports.verifyPayment = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can verify payments' });
  }

  const { reference } = req.params;

  if (!reference) {
    return res.status(400).json({ message: 'Reference is required' });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { status, amount, metadata } = response.data.data;
    if (status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const lease = await Lease.findById(metadata.lease_id);
    if (!lease || lease.tenant_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Lease not found or not authorized' });
    }

    const payment = await Payment.create({
      lease_id: metadata.lease_id,
      tenant_id: req.user._id,
      amount: amount / 100, // Convert back from kobo
      transaction_id: reference,
      status: 'completed'
    });

    res.status(200).json({
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to verify payment',
      error: error.response?.data?.message || error.message
    });
  }
};