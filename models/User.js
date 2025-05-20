// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['tenant', 'landlord'], required: true },
  phone: { type: String }, // Still store phone, but no verification
  profile_picture: { type: String },
  occupation: { type: String },
  next_of_kin: { type: String },
  emergency_contact: { type: String },
  email_verified: { type: Boolean, default: false },
  auth_provider: { type: String, enum: ['local', 'google'], default: 'local' },
  created_at: { type: Date, default: Date.now },
  identity_verified: { type: Boolean, default: false },
  nin: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model('User', UserSchema);