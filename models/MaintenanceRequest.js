const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);