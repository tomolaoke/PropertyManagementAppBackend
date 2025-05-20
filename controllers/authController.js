// controllers/authController.js
const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');
const passport = require('passport');
const { mockVerifyNIN } = require('../mockApi');

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

  // Normalize email
  const emailLower = email.toLowerCase().trim();
  console.log('Attempting to register email:', emailLower); // Debug log

  // Check for existing user
  const userExists = await User.findOne({ email: emailLower });
  if (userExists) {
    console.log('Existing user found:', userExists); // Debug log
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    name,
    email: emailLower,
    password: hashedPassword,
    role,
    phone, // Still store phone, but no verification
    email_verified: false,
    auth_provider: 'local',
    created_at: new Date()
  });

  console.log('User created:', user); // Debug log

  const emailOTP = generateOTP();
  await Token.create({
    user_id: user._id,
    type: 'email_verification',
    token: emailOTP,
    expires_at: new Date(Date.now() + 3600000) // 1 hour expiry
  });
  try {
    await sendEmail(emailLower, 'Verify Your Email - Property Manager', `Your OTP is ${emailOTP}`);
  } catch (error) {
    console.error('Email send error:', error); // Debug log
    return res.status(500).json({ message: 'Failed to send email OTP' });
  }

  res.status(201).json({ message: 'User registered. Verify your email.' });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const emailLower = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailLower });
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
  res.json({ token, user: { id: user._id, name: user.name, email: emailLower, role: user.role } });
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  const emailLower = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailLower });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = await Token.findOne({ user_id: user._id, type: 'email_verification', token: otp });
  if (!token || token.expires_at < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.email_verified = true;
  await user.save();
  await Token.deleteOne({ _id: token._id });
  res.json({ message: 'Email verified' });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const emailLower = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailLower });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.auth_provider === 'google') {
    return res.status(400).json({ message: 'Password reset not available for Google accounts' });
  }

  const resetToken = generateOTP();
  await Token.create({
    user_id: user._id,
    type: 'password_reset',
    token: resetToken,
    expires_at: new Date(Date.now() + 3600000)
  });
  try {
    await sendEmail(emailLower, 'Password Reset - Property Manager', `Your reset OTP is ${resetToken}`);
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ message: 'Failed to send reset OTP' });
  }
  res.json({ message: 'Reset OTP sent to email' });
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const emailLower = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailLower });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const token = await Token.findOne({ user_id: user._id, type: 'password_reset', token: otp });
  if (!token || token.expires_at < new Date()) {
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
    state: role
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

// POST /api/auth/verify-identity
exports.verifyIdentity = async (req, res) => {
  const { nin, firstName, lastName, dateOfBirth } = req.body;
  if (!nin || !firstName || !lastName || !dateOfBirth) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!/^\d{11}$/.test(nin)) {
    return res.status(400).json({ message: 'NIN must be 11 digits' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const response = await mockVerifyNIN(nin, firstName, lastName, dateOfBirth);
    if (response.status === 'success' && response.data.verified) {
      user.identity_verified = true;
      user.nin = nin;
      await user.save();
      return res.json({ message: 'Identity verified successfully', data: response.data });
    } else {
      return res.status(400).json({ message: 'Verification failed', details: response.data });
    }
  } catch (error) {
    console.error('Identity verification error:', error.message);
    return res.status(500).json({ message: 'Server error during verification', error: error.message });
  }
};