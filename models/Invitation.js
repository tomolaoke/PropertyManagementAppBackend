const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  landlord_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant_email: { type: String, required: true },
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  lease_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', InvitationSchema);