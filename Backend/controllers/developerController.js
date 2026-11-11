const crypto = require('crypto');
const User = require('../Models/User');
const { dispatchWebhookEvent } = require('../Utils/webhookDispatcher');

// ----------------- Personal Access Tokens (PAT) -----------------

const listPATs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('personalAccessTokens');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tokens = (user.personalAccessTokens || []).map((t) => ({
      tokenId: t.tokenId,
      name: t.name,
      tokenPrefix: t.tokenPrefix,
      scopes: t.scopes,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
    }));

    res.json(tokens);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving personal access tokens' });
  }
};

const createPAT = async (req, res) => {
  try {
    const { name, scopes, expirationDays = 90 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Token name is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.personalAccessTokens)) {
      user.personalAccessTokens = [];
    }

    if (user.personalAccessTokens.length >= 15) {
      return res.status(400).json({ message: 'Maximum limit of 15 active access tokens reached' });
    }

    const randomSecret = crypto.randomBytes(24).toString('hex');
    const rawToken = `bsum_pat_${randomSecret}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenId = `pat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const tokenPrefix = `bsum_pat_${randomSecret.slice(0, 4)}...${randomSecret.slice(-4)}`;

    const validScopes = Array.isArray(scopes) && scopes.length > 0 ? scopes : ['stories:read'];
    const expiresAt = new Date(Date.now() + Number(expirationDays) * 24 * 60 * 60 * 1000);

    const tokenEntry = {
      tokenId,
      name: name.trim(),
      tokenHash,
      tokenPrefix,
      scopes: validScopes,
      expiresAt,
      createdAt: new Date(),
    };

    user.personalAccessTokens.unshift(tokenEntry);
    await user.save();

    res.status(201).json({
      success: true,
      rawToken, // Sent ONLY once upon creation
      token: {
        tokenId,
        name: tokenEntry.name,
        tokenPrefix,
        scopes: tokenEntry.scopes,
        expiresAt,
        createdAt: tokenEntry.createdAt,
      },
    });
  } catch (err) {
    console.error('Error creating PAT:', err);
    res.status(500).json({ message: 'Failed to generate personal access token' });
  }
};

const revokePAT = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.personalAccessTokens = (user.personalAccessTokens || []).filter((t) => t.tokenId !== tokenId);
    await user.save();

    res.json({ success: true, message: 'Access token revoked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke token' });
  }
};

// ----------------- Outgoing Webhooks -----------------

const listWebhooks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('webhooks');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.webhooks || []);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving webhooks' });
  }
};

const createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ message: 'A valid HTTPS or HTTP endpoint URL is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!Array.isArray(user.webhooks)) {
      user.webhooks = [];
    }

    if (user.webhooks.length >= 10) {
      return res.status(400).json({ message: 'Maximum limit of 10 active webhooks reached' });
    }

    const webhookId = `wh_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const validEvents = Array.isArray(events) && events.length > 0 ? events : ['story.published'];

    const newHook = {
      webhookId,
      url: url.trim(),
      secret,
      events: validEvents,
      active: true,
      createdAt: new Date(),
    };

    user.webhooks.push(newHook);
    await user.save();

    res.status(201).json({
      success: true,
      webhook: newHook,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create webhook' });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.webhooks = (user.webhooks || []).filter((w) => w.webhookId !== webhookId);
    await user.save();

    res.json({ success: true, message: 'Webhook endpoint removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove webhook' });
  }
};

const testWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hook = (user.webhooks || []).find((w) => w.webhookId === webhookId);
    if (!hook) return res.status(404).json({ message: 'Webhook not found' });

    await dispatchWebhookEvent(user._id, 'ping', {
      message: 'Test ping from BlogSum Developer Portal',
      testTime: new Date().toISOString(),
    });

    res.json({ success: true, message: `Ping event dispatched to ${hook.url}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to test webhook' });
  }
};

module.exports = {
  listPATs,
  createPAT,
  revokePAT,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
};

