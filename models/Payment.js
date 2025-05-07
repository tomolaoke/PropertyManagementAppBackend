const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  lease_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease', required: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transaction_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);