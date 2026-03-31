// netlify/functions/products.js
// GET /api/products?category=gifts&sort=price_asc&search=tazza

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

  const { category, sort, search } = event.queryStringParameters || {};
  const db = getDb();

  try {
    let results;

    if (db) {
      // Build dynamic SQL
      let conditions = [];
      let params = [];
      let idx = 1;

      if (category && category !== 'all') {
        conditions.push(`category = $${idx++}`);
        params.push(category);
      }
      if (search) {
        conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      let orderBy = 'id ASC';
      if (sort === 'price_asc') orderBy = 'price ASC';
      else if (sort === 'price_desc') orderBy = 'price DESC';
      else if (sort === 'name_asc') orderBy = 'name ASC';

      results = await db(
        `SELECT * FROM products ${where} ORDER BY ${orderBy}`,
        params
      );

      // Parse JSON array fields stored as text
      results = results.map(p => ({
        ...p,
        personalizeOptions: p.personalize_options || [],
        isSpecialOffer: p.is_special_offer,
      }));
    } else {
      // Fallback to mock data
      results = mockProducts;
      if (category && category !== 'all') {
        results = results.filter(p => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(p =>
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }
      if (sort === 'price_asc') results = [...results].sort((a, b) => a.price - b.price);
      else if (sort === 'price_desc') results = [...results].sort((a, b) => b.price - a.price);
      else if (sort === 'name_asc') results = [...results].sort((a, b) => a.name.localeCompare(b.name));

      // Normalize snake_case fields to camelCase (same as DB path)
      results = results.map(p => ({
        ...p,
        personalizeOptions: p.personalize_options || [],
        isSpecialOffer: p.is_special_offer,
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error('products error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore interno del server' }),
    };
  }
};
