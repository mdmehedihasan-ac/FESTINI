// netlify/functions/admin-login.js
// POST /api/admin-login  { email, password }
// Returns: { token }

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { signToken } = require('./_auth');

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

  const { email, password } = body;

  if (!email || !password) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email e password obbligatori' }) };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  // In dev mode without env vars configured — use hardcoded credentials
  // IMPORTANT: change these before deploying to production!
  const devEmail = 'admin@festini.it';
  const devPassword = 'admin1234';

  let isValid = false;

  if (adminEmail && adminHash) {
    // Production: compare with bcrypt hash
    const emailMatch = email === adminEmail;
    const passMatch = await bcrypt.compare(password, adminHash);
    isValid = emailMatch && passMatch;
  } else {
    // Development fallback
    isValid = email === devEmail && password === devPassword;
  }

  if (!isValid) {
    // Use generic error to prevent user enumeration
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Credenziali non valide' }) };
  }

  const token = signToken({ email, role: 'admin' });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token, email }),
  };
};
