// netlify/functions/create-paypal-order.js
// POST /api/create-paypal-order
// Body: { items: [{ id, name, price, qty }] }
// Returns: { orderId }

require('dotenv').config();

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox';
  const baseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return { token: data.access_token, baseUrl };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'PayPal non configurato. Aggiungi PAYPAL_CLIENT_ID e PAYPAL_CLIENT_SECRET.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Carrello vuoto' }) };
  }

  // Validate
  for (const item of items) {
    if (typeof item.price !== 'number' || item.price <= 0 || !item.qty || item.qty < 1) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dati prodotto non validi' }) };
    }
  }

  try {
    const { token, baseUrl } = await getPayPalAccessToken();

    const itemTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const shipping = 4.99;
    const total = (itemTotal + shipping).toFixed(2);

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: total,
            breakdown: {
              item_total: { currency_code: 'EUR', value: itemTotal.toFixed(2) },
              shipping: { currency_code: 'EUR', value: shipping.toFixed(2) },
            },
          },
          items: items.map(i => ({
            name: i.name.substring(0, 127),
            quantity: String(i.qty),
            unit_amount: { currency_code: 'EUR', value: i.price.toFixed(2) },
          })),
        },
      ],
      application_context: {
        brand_name: 'Smart Print Ciotta',
        locale: 'it-IT',
        shipping_preference: 'GET_FROM_FILE',
        user_action: 'PAY_NOW',
      },
    };

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal order creation failed: ${err}`);
    }

    const order = await res.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ orderId: order.id }),
    };
  } catch (err) {
    console.error('create-paypal-order error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore nella creazione dell\'ordine PayPal: ' + err.message }),
    };
  }
};
