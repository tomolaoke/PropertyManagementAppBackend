const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const requestController = require('../controllers/requestController');

router.post('/', protect, requestController.createRequest);
router.get('/', protect, requestController.getRequests);

module.exports = router;