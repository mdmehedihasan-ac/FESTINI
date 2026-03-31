// netlify/functions/product.js
// GET /api/product?id=1

const { getDb } = require('./_db');
const { products: mockProducts } = require('./_mockData');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const { id } = event.queryStringParameters || {};

  if (!id || isNaN(parseInt(id))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID non valido' }) };
  }

  const db = getDb();

  try {
    let product;

    if (db) {
      const rows = await db('SELECT * FROM products WHERE id = $1', [parseInt(id)]);
      if (!rows.length) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Prodotto non trovato' }) };
      }
      const p = rows[0];
      product = {
        ...p,
        personalizeOptions: p.personalize_options || [],
        isSpecialOffer: p.is_special_offer,
      };
    } else {
      const found = mockProducts.find(p => p.id === parseInt(id));
      if (!found) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Prodotto non trovato' }) };
      }
      // Normalize snake_case fields to camelCase (same as DB path)
      product = {
        ...found,
        personalizeOptions: found.personalize_options || [],
        isSpecialOffer: found.is_special_offer,
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
    };
  } catch (err) {
    console.error('product error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore interno del server' }),
    };
  }
};
