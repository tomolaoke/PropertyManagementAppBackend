const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createProperty, getProperties, getProperty, updateProperty, deleteProperty } = require('../controllers/propertyController'); // Fixed to propertyController

// Protected routes for property management
router.post('/', protect, createProperty); // Create a new property (Landlord only)
router.get('/', protect, getProperties); // Get all properties (Landlord: own, Tenant: all active)
router.get('/:id', protect, getProperty); // Get details of a single property
router.put('/:id', protect, updateProperty); // Update a property (Landlord only)
router.delete('/:id', protect, deleteProperty); // Delete (soft delete) a property (Landlord only)

module.exports = router;