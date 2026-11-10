const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const {
  createChannel,
  getChannels,
  joinChannel,
  leaveChannel,
  inviteToChannel,
  acceptChannelInvite,
  declineChannelInvite,
  getChannel,
} = require('../controllers/channelController');

router.post('/', protect, createChannel);
router.get('/', protect, getChannels);
router.post('/join/:id', protect, joinChannel);
router.post('/leave/:id', protect, leaveChannel);
router.post('/invite/:id', protect, inviteToChannel);
router.post('/accept/:id', protect, acceptChannelInvite);
router.post('/decline/:id', protect, declineChannelInvite);
router.get('/:id', protect, getChannel);

module.exports = router;
