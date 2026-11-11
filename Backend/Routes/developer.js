const express = require('express');
const router = express.Router();
const { protect } = require('../MiddleWares/authMiddleWare');
const {
  listPATs,
  createPAT,
  revokePAT,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
} = require('../controllers/developerController');

// Personal Access Tokens (PAT)
router.get('/tokens', protect, listPATs);
router.post('/tokens', protect, createPAT);
router.delete('/tokens/:tokenId', protect, revokePAT);

// Outgoing Webhooks
router.get('/webhooks', protect, listWebhooks);
router.post('/webhooks', protect, createWebhook);
router.delete('/webhooks/:webhookId', protect, deleteWebhook);
router.post('/webhooks/:webhookId/test', protect, testWebhook);

module.exports = router;

