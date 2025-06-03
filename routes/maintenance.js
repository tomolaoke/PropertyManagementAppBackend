const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createMaintenanceRequest, getMaintenanceRequests } = require('../controllers/maintenanceController');

// POST /api/maintenance - Submit a maintenance request (Tenant only)
router.post('/', protect, createMaintenanceRequest);

// GET /api/maintenance - List all maintenance requests (Landlord: all, Tenant: own)
router.get('/', protect, getMaintenanceRequests);

module.exports = router;