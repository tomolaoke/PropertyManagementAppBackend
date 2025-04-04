// models/Token.js
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['email_verification', 'phone_verification', 'password_reset'], required: true },
  token: { type: String, required: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', TokenSchema);