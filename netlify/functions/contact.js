// netlify/functions/contact.js
// POST /api/contact  { name, email, subject, message }
// Saves to DB (if available) and sends an email via Gmail SMTP.

require('dotenv').config();
const nodemailer = require('nodemailer');
const { getDb } = require('./_db');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

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

  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Nome, email e messaggio sono obbligatori.' }),
    };
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Indirizzo email non valido.' }) };
  }

  const db = getDb();

  try {
    // Save to DB if available
    if (db) {
      await db(
        'INSERT INTO contact_submissions (name, email, subject, message) VALUES ($1, $2, $3, $4)',
        [name, email, subject || 'Informazioni Generali', message]
      );
    }

    // Send email if configured
    const transporter = createTransporter();
    if (transporter) {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

      // Notification to admin
      await transporter.sendMail({
        from: `"FESTINI Contact" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        replyTo: email,
        subject: `[FESTINI] Nuovo messaggio: ${subject || 'Informazioni Generali'}`,
        html: `
          <h2>Nuovo messaggio dal sito FESTINI</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;font-weight:bold;background:#fdf5f9">Nome</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#fdf5f9">Email</td><td style="padding:8px">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#fdf5f9">Argomento</td><td style="padding:8px">${subject || '—'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#fdf5f9">Messaggio</td><td style="padding:8px">${message.replace(/\n/g, '<br>')}</td></tr>
          </table>
        `,
      });

      // Auto-reply to customer
      await transporter.sendMail({
        from: `"Smart Print Ciotta" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Messaggio ricevuto — Smart Print Ciotta',
        html: `
          <p>Ciao <strong>${name}</strong>,</p>
          <p>Grazie per averci contattato! Abbiamo ricevuto il tuo messaggio e ti risponderemo entro 24 ore lavorative.</p>
          <p>Se hai urgenza puoi chiamarci al <strong>+39 02 1234 5678</strong>.</p>
          <br>
          <p>A presto,<br><strong>Il team Smart Print Ciotta</strong></p>
        `,
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Il tuo messaggio è stato inviato con successo! Ti contatteremo a breve.' }),
    };
  } catch (err) {
    console.error('contact error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore durante l\'invio. Riprova più tardi.' }),
    };
  }
};
