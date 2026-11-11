const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const User = require('../Models/User');

const dispatchWebhookEvent = async (userId, eventName, payload) => {
  try {
    const user = await User.findById(userId).select('webhooks');
    if (!user || !Array.isArray(user.webhooks)) return;

    const activeWebhooks = user.webhooks.filter(
      (w) => w.active && (w.events.includes('*') || w.events.includes(eventName))
    );

    if (activeWebhooks.length === 0) return;

    const body = JSON.stringify({
      id: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      event: eventName,
      createdAt: new Date().toISOString(),
      data: payload,
    });

    for (const hook of activeWebhooks) {
      try {
        const parsedUrl = new URL(hook.url);
        const signature = crypto
          .createHmac('sha256', hook.secret || 'blogsum-secret')
          .update(body)
          .digest('hex');

        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'BlogSum-Webhooks/1.0',
            'X-BlogSum-Event': eventName,
            'X-BlogSum-Signature': signature,
          },
          timeout: 4000,
        };

        const req = client.request(options, (res) => {
          hook.lastStatusCode = res.statusCode;
          hook.lastTriggeredAt = new Date();
          user.save().catch(() => {});
        });

        req.on('error', () => {
          hook.lastStatusCode = 500;
          hook.lastTriggeredAt = new Date();
          user.save().catch(() => {});
        });

        req.write(body);
        req.end();
      } catch (err) {
        console.error(`Webhook delivery failure to ${hook.url}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error dispatching webhooks:', error);
  }
};

module.exports = { dispatchWebhookEvent };

