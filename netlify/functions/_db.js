// netlify/functions/_db.js
// Shared Neon PostgreSQL client used by all Netlify Functions.
// Falls back to mock data when DATABASE_URL is not set (local dev without DB).

const { neon } = require('@neondatabase/serverless');

let sql;

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      // Return a mock that throws a clear error
      return null;
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

module.exports = { getDb };
