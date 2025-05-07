const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');

router.post('/', protect, invitationController.createInvitation);
router.get('/', protect, invitationController.getInvitations);
router.post('/:id/accept', protect, invitationController.acceptInvitation);
router.post('/:id/decline', protect, invitationController.declineInvitation);

module.exports = router;