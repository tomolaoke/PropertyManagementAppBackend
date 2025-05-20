const mongoose = require('mongoose');
const validator = require('validator');

const PropertySchema = new mongoose.Schema({
  landlord_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  utility_bill: {
    type: String,
    required: true,
    validate: {
      validator: (url) => validator.isURL(url, { require_protocol: true }),
      message: 'Invalid utility_bill URL'
    }
  },
  utility_bill_date: { type: Date, required: true },
  photos: {
    type: [{ type: String, validate: {
      validator: (url) => validator.isURL(url, { require_protocol: true }),
      message: 'Invalid photo URL'
    } }],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one photo URL is required'
    }
  },
  rent: { type: Number, required: true, min: [0, 'Rent cannot be negative'] },
  lease_duration: { type: Number, required: true, min: [1, 'Lease duration must be at least 1 month'] },
  type: { type: String, enum: ['apartment', 'house', 'commercial'], required: true },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);