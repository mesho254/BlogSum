/**
 * PayPal API Integration Utility
 * Handles OAuth2 client authentication, order creation, and capture
 */

let cachedAccessToken = null;
let tokenExpiresAt = 0;

const getPayPalBaseUrl = () => {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

/**
 * Exchange PayPal Client ID & Secret for OAuth2 Bearer Access Token
 */
async function getPayPalAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal Client ID or Secret is not configured in environment variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error('PayPal OAuth error:', data);
    throw new Error(data.error_description || 'Failed to authenticate with PayPal API');
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

/**
 * Create a PayPal Order with intent CAPTURE
 */
async function createPayPalOrder({ amount, currency = 'USD', description = 'Author Tip on BlogSum', customId = '' }) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const formattedAmount = Number(amount).toFixed(2);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: description.slice(0, 127),
        custom_id: customId ? String(customId).slice(0, 127) : undefined,
        amount: {
          currency_code: currency,
          value: formattedAmount,
        },
      },
    ],
    application_context: {
      brand_name: 'BlogSum Publishing',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: 'https://example.com/return',
      cancel_url: 'https://example.com/cancel',
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  const order = await response.json();

  if (!response.ok || !order.id) {
    console.error('PayPal create order failed:', order);
    throw new Error(order.message || 'Failed to initialize PayPal order');
  }

  return order;
}

/**
 * Capture an approved PayPal Order
 */
async function capturePayPalOrder(orderId) {
  const token = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const captureData = await response.json();

  if (!response.ok || captureData.status !== 'COMPLETED') {
    console.error('PayPal capture order failed:', captureData);
    throw new Error(
      captureData.message || `PayPal capture failed with status: ${captureData.status}`
    );
  }

  return captureData;
}

module.exports = {
  getPayPalBaseUrl,
  getPayPalAccessToken,
  createPayPalOrder,
  capturePayPalOrder,
};

