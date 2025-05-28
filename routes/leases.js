const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const leaseController = require('../controllers/leaseController');

// Routes
router.post('/', protect, leaseController.createLease);
router.get('/', protect, leaseController.getLeases);
router.get('/:id', protect, leaseController.getLease);
router.put('/:id', protect, leaseController.updateLease);
router.delete('/:id', protect, leaseController.deleteLease);

module.exports = router;