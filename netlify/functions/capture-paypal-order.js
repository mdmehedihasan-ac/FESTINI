// netlify/functions/capture-paypal-order.js
// POST /api/capture-paypal-order
// Body: { orderId, items }
// Returns: { success, orderNumber }

require('dotenv').config();
const { getDb } = require('./_db');

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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { orderId, items } = body;

  if (!orderId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId mancante' }) };
  }

  try {
    const { token, baseUrl } = await getPayPalAccessToken();

    const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal capture failed: ${err}`);
    }

    const capture = await res.json();

    if (capture.status !== 'COMPLETED') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Pagamento non completato' }) };
    }

    const purchaseUnit = capture.purchase_units?.[0];
    const captureData = purchaseUnit?.payments?.captures?.[0];
    const amount = parseFloat(captureData?.amount?.value || '0');
    const customerEmail = capture.payer?.email_address || '';
    const customerName = `${capture.payer?.name?.given_name || ''} ${capture.payer?.name?.surname || ''}`.trim();

    // Generate order number
    const orderNumber = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const db = getDb();
    if (db) {
      const orderRow = await db(
        `INSERT INTO orders (order_number, customer_email, customer_name, total_amount, payment_method, payment_id, status)
         VALUES ($1, $2, $3, $4, 'paypal', $5, 'paid')
         RETURNING id`,
        [orderNumber, customerEmail, customerName, amount, orderId]
      );

      if (items && Array.isArray(items)) {
        const orderId2 = orderRow[0].id;
        for (const item of items) {
          await db(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, personalization)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId2, item.id, item.name, item.qty, item.price, JSON.stringify(item.personalization || {})]
          );
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, orderNumber }),
    };
  } catch (err) {
    console.error('capture-paypal-order error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore durante la cattura del pagamento: ' + err.message }),
    };
  }
};
