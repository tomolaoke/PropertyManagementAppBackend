// filepath: c:\Users\Admin\property-manager-backend\routes\landlords.js
const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.send('Landlords route is working!');
});

module.exports = router;