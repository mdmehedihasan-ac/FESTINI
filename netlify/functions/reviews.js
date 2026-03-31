// netlify/functions/reviews.js
// GET /api/reviews

const { getDb } = require('./_db');
const { reviews: mockReviews } = require('./_mockData');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const db = getDb();

  try {
    let results;

    if (db) {
      results = await db('SELECT * FROM reviews ORDER BY created_at DESC');
    } else {
      results = mockReviews;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error('reviews error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore interno del server' }),
    };
  }
};
