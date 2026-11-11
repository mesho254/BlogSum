const webPush = require('web-push');
const User = require('../Models/User');

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

// If not provided in environment, generate static ephemeral pair
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  try {
    const generated = webPush.generateVAPIDKeys();
    vapidKeys = generated;
  } catch (err) {
    console.warn('Could not generate VAPID keys automatically:', err.message);
  }
}

const mailSubject = process.env.VAPID_SUBJECT || 'mailto:admin@blogsum.org';

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webPush.setVapidDetails(mailSubject, vapidKeys.publicKey, vapidKeys.privateKey);
  } catch (err) {
    console.warn('VAPID setup warning:', err.message);
  }
}

function getVapidPublicKey() {
  return vapidKeys.publicKey || '';
}

async function sendWebPushToUser(userId, payload = {}) {
  try {
    const user = await User.findById(userId).select('pushSubscriptions').lean();
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return { success: false, reason: 'no_subscriptions' };
    }

    const payloadString = JSON.stringify({
      title: payload.title || 'BlogSum Publication',
      body: payload.body || 'New story or notification',
      url: payload.url || '/',
    });

    const sendPromises = user.pushSubscriptions.map((sub) =>
      webPush.sendNotification(sub, payloadString).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired, remove
          User.updateOne(
            { _id: userId },
            { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } }
          ).exec();
        }
        console.warn('Failed to send push to individual endpoint:', err.message);
      })
    );

    await Promise.allSettled(sendPromises);
    return { success: true };
  } catch (error) {
    console.error('Error sending web push:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getVapidPublicKey,
  sendWebPushToUser,
};

