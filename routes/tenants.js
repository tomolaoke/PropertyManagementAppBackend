// filepath: c:\Users\Admin\property-manager-backend\routes\tenants.js
const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.send('Tenants route is working!');
});

module.exports = router;