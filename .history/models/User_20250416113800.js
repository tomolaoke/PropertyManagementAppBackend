// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Password is optional for Google users
  role: { type: String, enum: ['tenant', 'landlord'], required: true },
  phone: { type: String },
  email_verified: { type: Boolean, default: false },
  auth_provider: { type: String, enum: ['local', 'google'], default: 'local' },
  created_at: { type: Date, default: Date.now }
  identity_verified: { type: Boolean, default: false }, // For NIN verification
  nin: { type: String, unique: true, sparse: true } // Optional, unique if provided
});

module.exports = mongoose.model('User', UserSchema);