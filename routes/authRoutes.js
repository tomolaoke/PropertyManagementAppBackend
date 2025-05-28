const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-phone', authController.verifyPhone);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/resend-otp', authController.resendOTP); // New endpoint
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.post('/verify-identity', protect, authController.verifyIdentity);

module.exports = router;