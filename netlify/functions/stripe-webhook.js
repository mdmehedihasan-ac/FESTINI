// netlify/functions/stripe-webhook.js
// POST /api/stripe-webhook
// Listens for Stripe events and saves completed orders to DB.

require('dotenv').config();
const Stripe = require('stripe');
const { getDb } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 503, body: 'Stripe not configured' };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    if (webhookSecret && sig) {
      // In production with verified signature
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } else {
      // During development without signature verification
      stripeEvent = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    const customerEmail = session.customer_details?.email || '';
    const customerName = session.customer_details?.name || '';
    const amount = (session.amount_total || 0) / 100;
    const orderNumber = `STR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const db = getDb();
    if (db) {
      try {
        const orderRow = await db(
          `INSERT INTO orders (order_number, customer_email, customer_name, total_amount, payment_method, payment_id, status)
           VALUES ($1, $2, $3, $4, 'stripe', $5, 'paid')
           RETURNING id`,
          [orderNumber, customerEmail, customerName, amount, session.id]
        );

        // Parse items from session metadata
        const items = JSON.parse(session.metadata?.items || '[]');
        const orderId = orderRow[0].id;

        for (const item of items) {
          await db(
            `INSERT INTO order_items (order_id, product_id, quantity)
             VALUES ($1, $2, $3)`,
            [orderId, item.id, item.qty]
          );
        }
      } catch (err) {
        console.error('DB insert error after Stripe webhook:', err);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
