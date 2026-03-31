-- FESTINI — Neon PostgreSQL Schema
-- Run this script once on your Neon database to create all tables.
-- You can run it from the Neon SQL Editor or with psql.

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  price              NUMERIC(10,2) NOT NULL,
  category           TEXT NOT NULL,
  subcategory        TEXT,
  image              TEXT,
  description        TEXT,
  is_special_offer   BOOLEAN NOT NULL DEFAULT FALSE,
  personalize_options JSONB NOT NULL DEFAULT '[]',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  order_number     TEXT NOT NULL UNIQUE,
  customer_email   TEXT NOT NULL,
  customer_name    TEXT,
  total_amount     NUMERIC(10,2) NOT NULL,
  payment_method   TEXT NOT NULL,   -- 'stripe' | 'paypal'
  payment_id       TEXT NOT NULL,   -- Stripe session ID or PayPal order ID
  status           TEXT NOT NULL DEFAULT 'pending',
  -- status values: pending | paid | processing | shipped | delivered | cancelled
  shipping_address JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL DEFAULT '',
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC(10,2),
  personalization JSONB DEFAULT '{}'
);

-- Contact Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed initial data ──────────────────────────────────────────────────────────

INSERT INTO products (name, price, category, subcategory, image, description, is_special_offer, personalize_options)
VALUES
  ('Tazza Personalizzata Amore', 15.90, 'gifts', 'Valentine''s Day',
   'https://images.unsplash.com/photo-1514228742587-6b1558fcca09?w=500&q=80',
   'Tazza in ceramica personalizzabile con foto, nome e frase speciale. Ideale per San Valentino.',
   TRUE, '["Colore del manico","Carica Foto","Testo Personalizzato"]'),

  ('T-Shirt Cotone Premium', 24.50, 'apparel', NULL,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
   'T-Shirt 100% cotone personalizzabile con loghi aziendali o grafiche divertenti.',
   FALSE, '["Taglia","Colore","Carica Grafica"]'),

  ('Cornice Portafoto Incisa', 35.00, 'gifts', 'Matrimoni',
   'https://images.unsplash.com/photo-1578308697960-e4b2190f7075?w=500&q=80',
   'Elegante cornice in legno con incisione laser personalizzata, perfetta per matrimoni.',
   FALSE, '["Testo Incisione","Font"]'),

  ('Cuscino Personalizzato', 19.90, 'textiles', NULL,
   'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&q=80',
   'Morbido cuscino decorativo 40x40 cm, stampato con i tuoi ricordi più belli.',
   TRUE, '["Stampa Fronte/Retro","Carica Foto"]'),

  ('Kit Party Compleanno', 45.00, 'party', NULL,
   'https://images.unsplash.com/photo-1530103862676-de8892bf30b0?w=500&q=80',
   'Set completo per feste con striscione, bicchieri e piatti a tema personalizzato.',
   FALSE, '["Tema Giorno","Nome Festeggiato","Età"]'),

  ('Roll-up Pubblicitario', 55.00, 'promotional', NULL,
   'https://images.unsplash.com/photo-1563829026-6a7cb019ea3c?w=500&q=80',
   'Espositore roll-up 85x200 cm per fiere ed eventi aziendali.',
   FALSE, '["Carica Grafica PDF"]')

ON CONFLICT DO NOTHING;

INSERT INTO reviews (name, rating, comment)
VALUES
  ('Giulia Rossi', 5, 'Tazze ordinate per la festa della mamma arrivate in tempi record e la stampa è stupenda!'),
  ('Marco Bianchi', 5, 'Ottima qualità delle magliette per la nostra squadra sportiva. Il team di Smart Print Ciotta ha capito perfettamente cosa volevamo.'),
  ('Elena Verdi', 4, 'Ho fatto un ordine per il mio matrimonio: partecipazioni e bomboniere incise. Tutto meraviglioso, cura maniacale dei dettagli!')
ON CONFLICT DO NOTHING;
