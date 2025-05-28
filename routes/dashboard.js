const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/landlord', protect, dashboardController.getLandlordDashboard);
router.get('/tenant', protect, dashboardController.getTenantDashboard);

module.exports = router;