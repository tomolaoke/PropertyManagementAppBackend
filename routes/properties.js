const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const propertyController = require('../controllers/propertyController');
const rateLimit = require('express-rate-limit');

// Rate limiter for POST and PUT to prevent abuse
const createPropertyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP
  message: { message: 'Too many property creation requests, please try again later' }
});

// Routes
router.post('/', protect, createPropertyLimiter, propertyController.createProperty);
router.get('/', protect, propertyController.getProperties);
router.get('/:id', protect, propertyController.getProperty);
router.put('/:id', protect, createPropertyLimiter, propertyController.updateProperty);
router.delete('/:id', protect, propertyController.deleteProperty);

module.exports = router;