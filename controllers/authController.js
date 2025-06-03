const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
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
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already registered. Email exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const emailOTP = generateOTP();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      otp: emailOTP,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await Token.create({
      user_id: user._id,
      type: 'email_verification',
      token: emailOTP,
      expires_at: new Date(Date.now() + 3600000) // 1 hour
    });

    await sendEmail(email, 'Verify Your Email - Property Manager', `Your OTP is ${emailOTP}. It expires in 10 minutes.`);

    res.status(201).json({ message: 'User registered. Verify your email immediately.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.email_verified) return res.status(400).json({ message: 'Email already verified' });

    // Reuse existing OTP if not expired
    if (user.otp && user.otpExpires > Date.now()) {
      await sendEmail(
        email,
        'Resend OTP - Property Manager',
        `Your OTP is ${user.otp}. It expires in ${Math.ceil((user.otpExpires - Date.now()) / 60000)} minutes.`
      );
      return res.json({ message: 'OTP resent to email' });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    await user.save();

    await Token.create({
      user_id: user._id,
      type: 'email_verification',
      token: otp,
      expires_at: new Date(Date.now() + 3600000)
    });

    await sendEmail(
      email,
      'Resend OTP - Property Manager',
      `Your OTP is ${otp}. It expires in 20 minutes.`
    );

    res.json({ message: 'OTP resent to email wait a while before resending' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.auth_provider === 'google') {
      return res.status(400).json({ message: 'Please log in with Google' });
    }
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email with the OTP sent to your email' });
    }
    const token = generateJWT(user);
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.email_verified) return res.status(400).json({ message: 'Email already verified' });

    const token = await Token.findOne({ user_id: user._id, type: 'email_verification', token: otp });
    if (!token || token.expires_at < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.email_verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    await Token.deleteOne({ _id: token._id });
    res.json({ message: 'Email verified' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/verify-phone
exports.verifyPhone = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = await Token.findOne({ user_id: user._id, type: 'phone_verification', token: otp });
    if (!token || token.expires_at < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.phoneVerified = true;
    await user.save();
    await Token.deleteOne({ _id: token._id });
    res.json({ message: 'Phone verified' });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.auth_provider === 'google') {
      return res.status(400).json({ message: 'Password reset not available for Google accounts' });
    }

    const resetToken = generateOTP();
    user.otp = resetToken;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await Token.create({
      user_id: user._id,
      type: 'password_reset',
      token: resetToken,
      expires_at: new Date(Date.now() + 3600000)
    });

    await sendEmail(
      email,
      'Password Reset - Property Manager',
      `Your reset OTP is ${resetToken}. It expires in 10 minutes.`
    );

    res.json({ message: 'Reset OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = await Token.findOne({ user_id: user._id, type: 'password_reset', token: otp });
    if (!token || token.expires_at < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    await Token.deleteOne({ _id: token._id });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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
  try {
    if (!nin || !firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!/^\d{11}$/.test(nin)) {
      return res.status(400).json({ message: 'NIN must be 11 digits' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const response = await mockVerifyNIN(nin, firstName, lastName, dateOfBirth);
    if (response.status === 'success' && response.data.verified) {
      user.identity_verified = true;
      user.nin = nin;
      await user.save();
      return res.json({ message: 'Identity verified successfully', data: response.data });
    }
    return res.status(400).json({ message: 'Verification failed', details: response.data });
  } catch (error) {
    console.error('Identity verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};