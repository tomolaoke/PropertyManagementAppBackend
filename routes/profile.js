const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Profile routes (no file upload)
router.put('/', protect, profileController.updateProfile);
router.get('/', protect, profileController.getProfile);

module.exports = router;