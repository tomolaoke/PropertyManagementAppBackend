// filepath: c:\Users\Admin\property-manager-backend\routes\notifications.js
const express = require('express');
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.send('Notifications route is working!');
});

module.exports = router;