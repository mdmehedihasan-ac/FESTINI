// netlify/functions/admin-orders.js
// GET /api/admin-orders            → list all orders
// PUT /api/admin-orders?id=X       → update order status

require('dotenv').config();
const { authFromEvent } = require('./_auth');
const { getDb } = require('./_db');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const user = authFromEvent(event);
  if (!user || user.role !== 'admin') {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }

  const db = getDb();

  if (!db) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'Database non configurato. Configura DATABASE_URL.' }),
    };
  }

  const { id } = event.queryStringParameters || {};

  try {
    if (event.httpMethod === 'GET') {
      const orders = await db(
        `SELECT o.*, 
          json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          )) AS items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      );
      return { statusCode: 200, headers, body: JSON.stringify(orders) };
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obbligatorio' }) };

      const { status } = JSON.parse(event.body || '{}');
      const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

      if (!status || !allowed.includes(status)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Stato non valido' }) };
      }

      const rows = await db(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, parseInt(id)]
      );

      if (!rows.length) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Ordine non trovato' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('admin-orders error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Errore interno del server' }) };
  }
};
