// controllers/authController.js
const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const generateOTP = require('../utils/generateOTP');
const passport = require('passport');
const { mockVerifyNIN } = require('../mockApi'); // For NIN verification

const generateJWT = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }
  if (!['tenant', 'landlord'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({ name, email, password: hashedPassword, role, phone });

  const emailOTP = generateOTP();
  await Token.create({
    user_id: user._id,
    type: 'email_verification',
    token: emailOTP,
    expires_at: new Date.now() + 3600000 // 1 hour expiry
  });
  try {
    await sendEmail(email, 'Verify Your Email - Property Manager', `Your OTP is ${emailOTP}`);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send email OTP' });
  }

  if (phone) {
    const phoneOTP = generateOTP();
    await Token.create({
      user_id: user._id,
      type: 'phone_verification',
      token: phoneOTP,
      expires_at: new Date.now() + 3600000
    });
    try {
      await sendSMS(phone, `Your Property Manager OTP is ${phoneOTP}`);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to send SMS OTP' });
    }
  }

  res.status(201).json({ message: 'User registered. Verify your email/phone.' });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (user.auth_provider === 'google') {
    return res.status(400).json({ message: 'Please log in with Google' });
  }
  if (!user.password || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.email_verified) {
    return res.status(403).json({ message: 'Please verify your email' });
  }
  const token = generateJWT(user);
  res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = await Token.findOne({ user_id: user._id, type: 'email_verification', token: otp });
  if (!token || token.expires_at < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.email_verified = true;
  await user.save();
  await Token.deleteOne({ _id: token._id });
  res.json({ message: 'Email verified' });
};

// POST /api/auth/verify-phone
exports.verifyPhone = async (req, res) => {
  const { phone, otp } = req.body;
  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = await Token.findOne({ user_id: user._id, type: 'phone_verification', token: otp });
  if (!token || token.expires_at < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.phone_verified = true;
  await user.save();
  await Token.deleteOne({ _id: token._id });
  res.json({ message: 'Phone verified' });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.auth_provider === 'google') {
    return res.status(400).json({ message: 'Password reset not available for Google accounts' });
  }

  const resetToken = generateOTP();
  await Token.create({
    user_id: user._id,
    type: 'password_reset',
    token: resetToken,
    expires_at: new Date.now() + 3600000
  });
  try {
    await sendEmail(email, 'Password Reset - Property Manager', `Your reset OTP is ${resetToken}`);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send reset OTP' });
  }
  res.json({ message: 'Reset OTP sent to email' });
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = await Token.findOne({ user_id: user._id, type: 'password_reset', token: otp });
  if (!token || token.expires_at < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
  await Token.deleteOne({ _id: token._id });
  res.json({ message: 'Password reset successfully' });
};

// Google OAuth endpoints
exports.googleAuth = (req, res, next) => {
  const role = req.query.role;
  if (!role || !['tenant', 'landlord'].includes(role)) {
    return res.status(400).json({ message: 'Role is required' });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role // Pass role as state
  })(req, res, next);
};

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(400).json({ message: 'Authentication error', error: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    const token = generateJWT(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  })(req, res, next);
};


