// netlify/functions/newsletter.js
// POST /api/newsletter  { email }
// Saves subscriber and sends a welcome email with a discount code.

require('dotenv').config();
const nodemailer = require('nodemailer');
const { getDb } = require('./_db');

const DISCOUNT_CODE = 'BENVENUTO10';
const DISCOUNT_PERCENT = 10;

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

  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Indirizzo email non valido.' }) };
  }

  const db = getDb();

  try {
    if (db) {
      await db(
        `INSERT INTO newsletter_subscribers (email) VALUES ($1)
         ON CONFLICT (email) DO NOTHING`,
        [email]
      );
    }

    // Send welcome email with discount code
    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"Smart Print Ciotta" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `🎉 Ecco il tuo sconto del ${DISCOUNT_PERCENT}% — Smart Print Ciotta`,
        html: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#B50A74,#CE238D);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">Benvenuto nella Famiglia! 🎁</h1>
            </div>
            <div style="padding:30px;text-align:center;">
              <p style="font-size:16px;color:#4a4a4a;line-height:1.6;">
                Grazie per esserti iscritto alla nostra newsletter!<br>
                Come promesso, ecco il tuo codice sconto esclusivo:
              </p>
              <div style="background:#fdf5f9;border:2px dashed #B50A74;border-radius:12px;padding:20px;margin:25px 0;">
                <p style="font-size:14px;color:#4a4a4a;margin:0 0 8px;">Il tuo codice sconto</p>
                <p style="font-size:32px;font-weight:800;color:#B50A74;margin:0;letter-spacing:3px;">${DISCOUNT_CODE}</p>
                <p style="font-size:18px;color:#CE238D;font-weight:700;margin:8px 0 0;">${DISCOUNT_PERCENT}% di sconto sul tuo primo ordine</p>
              </div>
              <a href="${process.env.SITE_URL || 'https://smartprintciotta.it'}/shop" 
                 style="display:inline-block;background:linear-gradient(135deg,#B50A74,#CE238D);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:16px;margin-top:10px;">
                Scopri il Catalogo →
              </a>
              <p style="font-size:13px;color:#999;margin-top:25px;">
                Inserisci il codice al momento del checkout per ottenere lo sconto.
              </p>
            </div>
            <div style="background:#fdf5f9;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
              <p style="font-size:13px;color:#888;margin:0;">Smart Print Ciotta — Personalizziamo le tue emozioni ❤️</p>
            </div>
          </div>
        `,
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        discountCode: DISCOUNT_CODE,
        message: `Iscrizione avvenuta con successo! Ti abbiamo inviato un codice sconto del ${DISCOUNT_PERCENT}% via email.`,
      }),
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
