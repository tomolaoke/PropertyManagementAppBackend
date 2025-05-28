// Maintenance Endpoints (Educational Stubs)
// These endpoints allow tenants to submit maintenance requests and landlords to view them.
// Implement actual logic and connect to a Maintenance model as needed.
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// POST /api/maintenance - Submit a maintenance request (Tenant only)
router.post('/', protect, (req, res) => {
  // TODO: Implement maintenance request creation
  res.status(501).json({ message: 'Not implemented: Create maintenance request' });
});

// GET /api/maintenance - List all maintenance requests (Landlord: all, Tenant: own)
router.get('/', protect, (req, res) => {
  // TODO: Implement maintenance request listing
  res.status(501).json({ message: 'Not implemented: List maintenance requests' });
});

module.exports = router;
