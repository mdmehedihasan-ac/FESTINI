// netlify/functions/_auth.js
// JWT helpers used by admin-protected routes.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract and verify the Bearer token from an Authorization header.
 * Returns the decoded payload or null.
 */
function authFromEvent(event) {
  const header = event.headers['authorization'] || event.headers['Authorization'] || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return verifyToken(token);
}

module.exports = { signToken, verifyToken, authFromEvent };
