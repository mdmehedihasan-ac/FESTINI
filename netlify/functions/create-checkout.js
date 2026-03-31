// netlify/functions/create-checkout.js
// POST /api/create-checkout
// Body: { items: [{ id, name, price, qty, personalization }], shippingMethod }
// Returns: { sessionId, url }

require('dotenv').config();
const Stripe = require('stripe');
const { getDb } = require('./_db');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'Stripe non configurato. Aggiungi STRIPE_SECRET_KEY nelle variabili d\'ambiente.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { items, shippingMethod = 'standard' } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Carrello vuoto' }) };
  }

  // Validate and sanitize items
  for (const item of items) {
    if (!item.id || !item.name || typeof item.price !== 'number' || item.price <= 0 || !item.qty || item.qty < 1) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dati prodotto non validi' }) };
    }
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.SITE_URL || 'http://localhost:5173';

  try {
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
          metadata: {
            product_id: String(item.id),
            personalization: item.personalization ? JSON.stringify(item.personalization) : '',
          },
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.qty,
    }));

    // Shipping options
    const shippingOptions = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 499, currency: 'eur' },
          display_name: 'Spedizione Standard (3-5 gg)',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 5 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 999, currency: 'eur' },
          display_name: 'Spedizione Express (1-2 gg)',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: 2 },
          },
        },
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['IT', 'DE', 'FR', 'ES', 'GB', 'AT', 'BE', 'NL', 'CH'],
      },
      shipping_options: shippingOptions,
      success_url: `${siteUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      metadata: {
        items: JSON.stringify(items.map(i => ({ id: i.id, qty: i.qty }))),
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (err) {
    console.error('create-checkout error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore nella creazione del checkout: ' + err.message }),
    };
  }
};
