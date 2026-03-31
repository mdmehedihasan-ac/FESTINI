// server/index.js
// Local development server that mirrors the Netlify Functions API.
// In production, Netlify Functions handle everything — this file is only for local dev.
//
// Usage:
//   cd server && node index.js
//   (keep the Vite dev server running simultaneously on port 5173)

require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');

// Load function handlers (same code used by Netlify)
const productsHandler = require('../netlify/functions/products');
const productHandler = require('../netlify/functions/product');
const reviewsHandler = require('../netlify/functions/reviews');
const contactHandler = require('../netlify/functions/contact');
const newsletterHandler = require('../netlify/functions/newsletter');
const createCheckoutHandler = require('../netlify/functions/create-checkout');
const createPaypalOrderHandler = require('../netlify/functions/create-paypal-order');
const capturePaypalOrderHandler = require('../netlify/functions/capture-paypal-order');
const stripeWebhookHandler = require('../netlify/functions/stripe-webhook');
const adminLoginHandler = require('../netlify/functions/admin-login');
const adminProductsHandler = require('../netlify/functions/admin-products');
const adminOrdersHandler = require('../netlify/functions/admin-orders');
const adminContactsHandler = require('../netlify/functions/admin-contacts');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());

// Raw body for Stripe webhooks (must come before express.json())
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

/**
 * Adapts an Express req/res to the Netlify Function event/context pattern.
 */
function netlifyAdapter(handler) {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      path: req.path,
      queryStringParameters: req.query || {},
      headers: req.headers,
      body: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
        ? (Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body))
        : null,
    };

    try {
      const result = await handler.handler(event, {});
      const statusCode = result.statusCode || 200;

      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'access-control-allow-origin') res.setHeader(key, value);
        });
      }

      res.status(statusCode).send(result.body);
    } catch (err) {
      console.error('Handler error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// ── Routes ─────────────────────────────────────────────────────────────────

// Products
app.all('/api/products', netlifyAdapter(productsHandler));
// Single product — frontend calls /api/product?id=X (matches Netlify function name)
app.all('/api/product', netlifyAdapter(productHandler));
// Also support /api/products/:id as a convenience alias
app.all('/api/products/:id', (req, res, next) => {
  req.query.id = req.params.id;
  netlifyAdapter(productHandler)(req, res, next);
});

// Reviews
app.all('/api/reviews', netlifyAdapter(reviewsHandler));

// Contact & Newsletter
app.all('/api/contact', netlifyAdapter(contactHandler));
app.all('/api/newsletter', netlifyAdapter(newsletterHandler));

// Payments
app.all('/api/create-checkout', netlifyAdapter(createCheckoutHandler));
app.all('/api/create-paypal-order', netlifyAdapter(createPaypalOrderHandler));
app.all('/api/capture-paypal-order', netlifyAdapter(capturePaypalOrderHandler));
app.all('/api/stripe-webhook', netlifyAdapter(stripeWebhookHandler));

// Admin
app.all('/api/admin-login', netlifyAdapter(adminLoginHandler));
app.all('/api/admin-products', netlifyAdapter(adminProductsHandler));
app.all('/api/admin-orders', netlifyAdapter(adminOrdersHandler));
app.all('/api/admin-contacts', netlifyAdapter(adminContactsHandler));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: process.env.DATABASE_URL ? 'configured' : 'mock (no DATABASE_URL)',
    stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
    paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not configured',
    email: process.env.GMAIL_USER ? 'configured' : 'not configured',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('');
  console.log('  🚀 FESTINI Backend — dev server running');
  console.log(`  👉 http://localhost:${PORT}`);
  console.log(`  🔍 Health: http://localhost:${PORT}/health`);
  console.log('');
  if (!process.env.DATABASE_URL) {
    console.log('  ⚠️  DATABASE_URL not set — using mock data');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('  ⚠️  STRIPE_SECRET_KEY not set — checkout will return error');
  }
  if (!process.env.PAYPAL_CLIENT_ID) {
    console.log('  ⚠️  PAYPAL_CLIENT_ID not set — PayPal will return error');
  }
  if (!process.env.GMAIL_USER) {
    console.log('  ⚠️  GMAIL_USER not set — contact emails won\'t be sent');
  }
  console.log('');
});
