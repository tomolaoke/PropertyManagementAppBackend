const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  landlord_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  utility_bill: { type: String, required: true }, // Cloudinary URL for utility bill
  utility_bill_date: { type: Date, required: true }, // To validate age
  photos: [{ type: String }], // Array of Cloudinary URLs, not individually required
  rent: { type: Number, required: true },
  lease_duration: { type: Number, required: true }, // In months
  type: { type: String, enum: ['apartment', 'house', 'commercial'], required: true },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);