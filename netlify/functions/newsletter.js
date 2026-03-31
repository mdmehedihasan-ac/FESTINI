// netlify/functions/newsletter.js
// POST /api/newsletter  { email }

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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Indirizzo email non valido.' }) };
  }

  const db = getDb();

  try {
    if (db) {
      // Upsert: ignore if already subscribed
      await db(
        `INSERT INTO newsletter_subscribers (email) VALUES ($1)
         ON CONFLICT (email) DO NOTHING`,
        [email]
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Iscrizione avvenuta con successo! Benvenuto nella nostra newsletter.' }),
    };
  } catch (err) {
    console.error('newsletter error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore durante l\'iscrizione. Riprova più tardi.' }),
    };
  }
};
