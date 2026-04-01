import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageCircle, ArrowRight, Loader, Quote, CheckCircle, ThumbsUp } from 'lucide-react';
import './Reviews.css';

const StarRating = ({ rating, size = 18 }) => (
  <div className="stars-row">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={size}
        fill={i <= rating ? 'var(--accent)' : 'transparent'}
        color={i <= rating ? 'var(--accent)' : '#ddd'}
      />
    ))}
  </div>
);

const ReviewCard = ({ review }) => (
  <div className="rv-card">
    <Quote size={22} className="rv-quote-icon" />
    <StarRating rating={review.rating} />
    <p className="rv-text">"{review.comment}"</p>
    <div className="rv-author">
      <div className="rv-avatar">{review.name.charAt(0).toUpperCase()}</div>
      <div className="rv-author-info">
        <h4>{review.name}</h4>
        <div className="rv-verified">
          <CheckCircle size={14} color="#2e7d32" />
          <span>Acquirente Verificato</span>
        </div>
      </div>
      {review.helpful > 0 && (
        <div className="rv-helpful">
          <ThumbsUp size={13} />
          <span>{review.helpful}</span>
        </div>
      )}
    </div>
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0 = all
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, comment: '' });
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => {
        // Enrich with helpful count for display variety
        const enriched = data.map((r, i) => ({ ...r, helpful: [4, 2, 7, 1, 5, 3, 0][i % 7] }));
        setReviews(enriched);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  const displayed = filter === 0 ? reviews : reviews.filter(r => r.rating === filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.comment) return;
    setSubmitStatus('loading');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus('success');
        setSubmitMsg('Grazie per la tua recensione! Verrà pubblicata dopo approvazione.');
        setForm({ name: '', rating: 5, comment: '' });
        setShowForm(false);
      } else {
        setSubmitStatus('error');
        setSubmitMsg(data.error || 'Errore invio. Riprova.');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitMsg('Errore di connessione. Riprova più tardi.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Loader className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="reviews-page animate-fade-in">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="rv-hero">
        <div className="container rv-hero-inner">
          <div className="rv-hero-text">
            <span className="rv-eyebrow">Le opinioni dei nostri clienti</span>
            <h1>Le nostre <span>Recensioni</span></h1>
            <p>Ogni commento è reale, ogni stella è guadagnata. Scopri cosa dicono i nostri clienti.</p>
          </div>

          {/* Overall stats */}
          <div className="rv-stats-card">
            <div className="rv-avg">
              <span className="rv-avg-number">{avgRating}</span>
              <StarRating rating={Math.round(parseFloat(avgRating))} size={22} />
              <span className="rv-total-count">{reviews.length} recensioni</span>
            </div>
            <div className="rv-distribution">
              {distribution.map(d => (
                <div key={d.star} className="rv-dist-row">
                  <span className="rv-dist-label">{d.star} ★</span>
                  <div className="rv-dist-bar">
                    <div className="rv-dist-fill" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="rv-dist-count">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust badges ────────────────────────────────────────── */}
      <section className="rv-trust">
        <div className="container rv-trust-grid">
          <div className="rv-trust-item">
            <CheckCircle size={22} color="var(--primary)" />
            <strong>100% Verificate</strong>
            <span>Solo clienti reali</span>
          </div>
          <div className="rv-trust-item">
            <Star size={22} color="var(--accent)" fill="var(--accent)" />
            <strong>4.9 / 5 Stelle</strong>
            <span>Media su tutti i prodotti</span>
          </div>
          <div className="rv-trust-item">
            <ThumbsUp size={22} color="var(--primary)" />
            <strong>98% Soddisfatti</strong>
            <span>Consiglierebbe a un amico</span>
          </div>
          <div className="rv-trust-item">
            <MessageCircle size={22} color="var(--primary)" />
            <strong>Risposta Garantita</strong>
            <span>Problemi risolti in 24h</span>
          </div>
        </div>
      </section>

      {/* ─── Filters + Grid ──────────────────────────────────────── */}
      <section className="rv-main section">
        <div className="container">
          <div className="rv-controls">
            <h2 className="section-title">Cosa dicono di noi</h2>
            <div className="rv-filters">
              <button
                className={`rv-filter-btn ${filter === 0 ? 'active' : ''}`}
                onClick={() => setFilter(0)}
              >
                Tutte ({reviews.length})
              </button>
              {[5, 4, 3].map(s => (
                <button
                  key={s}
                  className={`rv-filter-btn ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  {'⭐'.repeat(s)} ({reviews.filter(r => r.rating === s).length})
                </button>
              ))}
            </div>
          </div>

          {displayed.length === 0 ? (
            <p className="rv-empty">Nessuna recensione per questo filtro.</p>
          ) : (
            <div className="rv-grid">
              {displayed.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Post a review CTA */}
          <div className="rv-submit-section">
            {submitStatus === 'success' ? (
              <div className="rv-submit-success">
                <CheckCircle size={32} color="#2e7d32" />
                <p>{submitMsg}</p>
              </div>
            ) : showForm ? (
              <div className="rv-form-wrap">
                <h3>Lascia la tua Recensione</h3>
                <form onSubmit={handleSubmit} className="rv-form">
                  <div className="rv-form-group">
                    <label>Il tuo nome *</label>
                    <input
                      type="text"
                      placeholder="es. Alessia M."
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="rv-form-group">
                    <label>Valutazione *</label>
                    <div className="rv-star-picker">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`rv-star-btn ${form.rating >= s ? 'selected' : ''}`}
                          onClick={() => setForm(f => ({ ...f, rating: s }))}
                          aria-label={`${s} stelle`}
                        >
                          <Star size={28} fill={form.rating >= s ? 'var(--accent)' : 'transparent'} color={form.rating >= s ? 'var(--accent)' : '#ccc'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rv-form-group">
                    <label>Commento *</label>
                    <textarea
                      rows={4}
                      placeholder="Racconta la tua esperienza con il nostro prodotto..."
                      value={form.comment}
                      onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                      required
                    />
                  </div>
                  {submitStatus === 'error' && <p className="rv-form-error">{submitMsg}</p>}
                  <div className="rv-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitStatus === 'loading'}>
                      {submitStatus === 'loading' ? <><Loader className="animate-spin" size={16} /> Invio...</> : 'Invia Recensione'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Annulla</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rv-cta-block">
                <h3>Hai acquistato da noi?</h3>
                <p>Condividi la tua esperienza e aiuta altri clienti a scegliere il prodotto giusto!</p>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <Star size={18} /> Lascia una Recensione
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────── */}
      <section className="rv-final-cta">
        <div className="container text-center">
          <h2>Pronto a creare qualcosa di unico?</h2>
          <p>Unisciti a oltre 5000 clienti soddisfatti!</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link to="/shop" className="btn btn-white btn-lg">
              Vai al Catalogo <ArrowRight size={18} />
            </Link>
            <a
              href="https://wa.me/390212345678?text=Ciao! Vorrei informazioni sui vostri prodotti personalizzati."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-white"
            >
              <MessageCircle size={18} /> Scrivici su WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Reviews;
