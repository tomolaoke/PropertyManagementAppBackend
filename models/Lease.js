const mongoose = require('mongoose'); // Add this line

const LeaseSchema = new mongoose.Schema({
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  rent_amount: { type: Number, required: true },
  payment_terms: { type: String, required: true }, // e.g., "Monthly"
  document: { type: String }, // File path for lease document
  status: { type: String, enum: ['active', 'upcoming', 'expired'], default: 'upcoming' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lease', LeaseSchema);