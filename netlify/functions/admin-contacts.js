// netlify/functions/admin-contacts.js
// GET /api/admin-contacts  → list all contact submissions

require('dotenv').config();
const { authFromEvent } = require('./_auth');
const { getDb } = require('./_db');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
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
      body: JSON.stringify({ error: 'Database non configurato.' }),
    };
  }

  try {
    const rows = await db(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 200'
    );
    return { statusCode: 200, headers, body: JSON.stringify(rows) };
  } catch (err) {
    console.error('admin-contacts error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Errore interno del server' }) };
  }
};
