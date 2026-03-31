// netlify/functions/admin-products.js
// GET    /api/admin-products          → list all products
// POST   /api/admin-products          → create product
// PUT    /api/admin-products?id=X     → update product
// DELETE /api/admin-products?id=X     → delete product
// All routes require Bearer JWT token.

require('dotenv').config();
const { authFromEvent } = require('./_auth');
const { getDb } = require('./_db');
const { products: mockProducts } = require('./_mockData');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function unauthorized() {
  return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorizzato' }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const user = authFromEvent(event);
  if (!user || user.role !== 'admin') return unauthorized();

  const db = getDb();
  const { id } = event.queryStringParameters || {};

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      if (db) {
        const rows = await db('SELECT * FROM products ORDER BY id ASC');
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      } else {
        return { statusCode: 200, headers, body: JSON.stringify(mockProducts) };
      }
    }

    // ── POST (create) ────────────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      const { name, price, category, image, description, is_special_offer, personalize_options } = data;

      if (!name || price === undefined || !category) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'nome, prezzo e categoria obbligatori' }) };
      }

      if (db) {
        const rows = await db(
          `INSERT INTO products (name, price, category, image, description, is_special_offer, personalize_options)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            name,
            parseFloat(price),
            category,
            image || '',
            description || '',
            Boolean(is_special_offer),
            JSON.stringify(personalize_options || []),
          ]
        );
        return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
      } else {
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'Database non configurato' }) };
      }
    }

    // ── PUT (update) ─────────────────────────────────────────────────────────
    if (event.httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obbligatorio' }) };

      const data = JSON.parse(event.body || '{}');
      const { name, price, category, image, description, is_special_offer, personalize_options } = data;

      if (db) {
        const rows = await db(
          `UPDATE products SET
            name = COALESCE($1, name),
            price = COALESCE($2, price),
            category = COALESCE($3, category),
            image = COALESCE($4, image),
            description = COALESCE($5, description),
            is_special_offer = COALESCE($6, is_special_offer),
            personalize_options = COALESCE($7, personalize_options),
            updated_at = NOW()
           WHERE id = $8 RETURNING *`,
          [
            name || null,
            price !== undefined ? parseFloat(price) : null,
            category || null,
            image !== undefined ? image : null,
            description !== undefined ? description : null,
            is_special_offer !== undefined ? Boolean(is_special_offer) : null,
            personalize_options !== undefined ? JSON.stringify(personalize_options) : null,
            parseInt(id),
          ]
        );

        if (!rows.length) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Prodotto non trovato' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      } else {
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'Database non configurato' }) };
      }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obbligatorio' }) };

      if (db) {
        const rows = await db('DELETE FROM products WHERE id = $1 RETURNING id', [parseInt(id)]);
        if (!rows.length) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Prodotto non trovato' }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      } else {
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'Database non configurato' }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('admin-products error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Errore interno del server' }) };
  }
};
