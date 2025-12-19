const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const {
  createChannel,
  getChannels,
  joinChannel,
  leaveChannel,
  getChannel,
} = require('../controllers/channelController');


router.post('/', protect, createChannel);
router.get('/', protect, getChannels);
router.post('/join/:id', protect, joinChannel);
router.post('/leave/:id', protect, leaveChannel);
router.get('/:id', protect, getChannel);

module.exports = router;