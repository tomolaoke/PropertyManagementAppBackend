const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google users
  role: { type: String, enum: ['tenant', 'landlord'], required: true },
  phone: { type: Number },
  profile_picture: { type: String }, // Cloudinary URL
  address: { type: String },
  date_of_birth: { type: Date },
  occupation: { type: String },
  next_of_kin: { type: String },
  emergency_contact: { type: String },
  email_verified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  auth_provider: { type: String, enum: ['local', 'google'], default: 'local' },
  created_at: { type: Date, default: Date.now },
  identity_verified: { type: Boolean, default: false },
  nin: { type: String, unique: true, sparse: true },
  otp: { type: String }, // Temporary OTP storage
  otpExpires: { type: Date } // OTP expiration
});

module.exports = mongoose.model('User', UserSchema);