import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Gift, ShoppingBag, Star, Heart, Loader, Truck, CreditCard, Paintbrush,
  Sparkles, Megaphone, Package, X, Mail, CheckCircle, Shield, Headphones, MousePointer,
  PackageCheck, MessageCircle, Camera, Quote
} from 'lucide-react';
import { categoryIconMap, categoryColorMap, ProductPlaceholder } from '../utils/productHelpers';
import './Home.css';

/* ── Product Card ──────────────────────────────────────────────────────────── */
const ProductCard = ({ product, badge }) => (
  <Link to={`/product/${product.id}`} className="product-card">
    <div className="product-image-container">
      {product.isSpecialOffer && <span className="badge-offer">Promo</span>}
      {badge && <span className="badge-bestseller">{badge}</span>}
      <ProductPlaceholder category={product.category} />
      {product.image && (
        <img src={product.image} alt={product.name} className="product-img" onError={e => { e.currentTarget.style.display = 'none'; }} />
      )}
      <div className="product-overlay">
        <span className="btn btn-primary">Personalizza</span>
      </div>
    </div>
    <div className="product-info">
      <span className="product-category">{product.subcategory || product.category}</span>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">€{product.price.toFixed(2)}</p>
    </div>
  </Link>
);

/* ── Newsletter Popup ──────────────────────────────────────────────────────── */
const NewsletterPopup = ({ show, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setDiscountCode(data.discountCode || 'BENVENUTO10');
        setMsg(data.message);
        localStorage.setItem('newsletter_subscribed', 'true');
      } else {
        setStatus('error');
        setMsg(data.error);
      }
    } catch {
      setStatus('error');
      setMsg('Errore di connessione. Riprova più tardi.');
    }
  };

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose} aria-label="Chiudi"><X size={22} /></button>

        {status === 'success' ? (
          <div className="popup-success">
            <CheckCircle size={56} color="#2e7d32" />
            <h2>Grazie!</h2>
            <p>Ti abbiamo inviato il codice sconto via email.</p>
            <div className="popup-discount-code">
              <span className="discount-label">Il tuo codice</span>
              <span className="discount-value">{discountCode}</span>
              <span className="discount-desc">10% di sconto sul primo ordine</span>
            </div>
            <Link to="/shop" className="btn btn-primary mt-4" onClick={onClose}>
              Inizia lo Shopping <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <div className="popup-icon-wrap">
              <Gift size={40} color="var(--primary)" />
            </div>
            <h2>Ottieni il 10% di Sconto!</h2>
            <p>Iscriviti alla nostra newsletter e ricevi subito un codice sconto esclusivo per il tuo primo ordine.</p>

            <form onSubmit={handleSubmit} className="popup-form">
              <div className="popup-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="La tua email..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary popup-submit" disabled={status === 'loading'}>
                {status === 'loading' ? <Loader className="animate-spin" size={18} /> : <>Ottieni lo Sconto <ArrowRight size={16} /></>}
              </button>
            </form>
            {status === 'error' && <p className="popup-error">{msg}</p>}
            <p className="popup-privacy">Niente spam, solo offerte esclusive. Puoi disiscriverti in ogni momento.</p>
            <button className="popup-no-thanks" onClick={onClose} type="button">
              No grazie, non voglio lo sconto
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

/* ── MAIN COMPONENT ────────────────────────────────────────────────────────── */
const Home = () => {
  const [specialOffers, setSpecialOffers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, reviewsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/reviews')
        ]);
        const all = await productsRes.json();
        const reviewsData = await reviewsRes.json();

        setSpecialOffers(all.filter(p => p.isSpecialOffer).slice(0, 4));
        setNewArrivals([...all].sort((a, b) => b.id - a.id).slice(0, 4));
        setBestSellers(all.filter(p => !p.isSpecialOffer).slice(0, 4));
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Show newsletter popup only on first visit of the session
  useEffect(() => {
    if (localStorage.getItem('newsletter_subscribed')) return;
    if (sessionStorage.getItem('popup_shown')) return;
    sessionStorage.setItem('popup_shown', 'true');
    setShowPopup(true);
  }, []);

  // Bundle suggestions
  const bundles = [
    {
      title: 'Kit Compleanno',
      desc: 'Calamite + Bolle di sapone + Sacchetti personalizzati per una festa indimenticabile.',
      price: 'da €29,90',
      icon: Sparkles,
      link: '/shop?category=party',
      color: '#fff8e1',
    },
    {
      title: 'Kit Regalo Romantico',
      desc: 'Tazza + Cuscino cuore personalizzati con la vostra foto. Il regalo perfetto.',
      price: 'da €24,90',
      icon: Heart,
      link: '/shop?category=gifts',
      color: '#fce4ec',
    },
    {
      title: 'Kit Nascita',
      desc: 'Cuscino caramella + Tazza + Calamita con nome & data del bebè.',
      price: 'da €34,90',
      icon: Gift,
      link: '/shop?category=textiles',
      color: '#e8f5e9',
    },
  ];

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Loader className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  const bestSellerBadges = ['Più venduto', 'Scelto dai clienti', 'Top seller', 'Preferito'];

  return (
    <div className="home-page animate-fade-in">

      {/* ── Newsletter Popup ────────────────────────────────────────────────── */}
      <NewsletterPopup show={showPopup} onClose={() => setShowPopup(false)} />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-subtitle mb-2">Stampa Creativa e Originale</span>
            <h1 className="hero-title mb-4">
              Personalizza<br />i tuoi <span>Ricordi</span>
            </h1>
            <p className="hero-desc mb-6">
              Gadget, abbigliamento e regali unici creati su misura.
              Colori, temi e design: ogni prodotto è pensato per te.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-lg">
                Crea il tuo Prodotto <Paintbrush size={20} />
              </Link>
              <Link to="/shop?category=party" className="btn btn-outline">
                Gadget Fine Festa <Sparkles size={18} />
              </Link>
            </div>

            {/* Trust elements */}
            <div className="hero-trust-badges">
              <div className="hero-trust-item">
                <Truck size={18} color="var(--primary)" />
                <span>Spedizione veloce</span>
              </div>
              <div className="hero-trust-item">
                <Paintbrush size={18} color="var(--primary)" />
                <span>Personalizzazione facile</span>
              </div>
              <div className="hero-trust-item">
                <Headphones size={18} color="var(--primary)" />
                <span>Assistenza clienti veloce</span>
              </div>
            </div>
          </div>
          <div className="hero-image-wrapper animate-delay-2">
            <div className="hero-placeholder">
              <Gift size={72} color="var(--primary)" />
              <p>Stampa Creativa</p>
            </div>
            <div className="glass-card satisfaction-card">
              <div className="stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--accent)" color="var(--accent)" />)}
              </div>
              <p>Oltre 5000 clienti soddisfatti!</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FEATURES BAR ─────────────────────────────────────────────────── */}
      <section className="features-bar">
        <div className="container features-grid">
          <div className="feature-item">
            <div className="feature-icon"><Paintbrush size={28} /></div>
            <div>
              <h4>Personalizzazione</h4>
              <p>Colori, temi e design: ogni prodotto è pensato per essere creato su misura per te.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Truck size={28} /></div>
            <div>
              <h4>Spedizione</h4>
              <p>Standard o express da 7,99€ in tutta Italia, oppure ritiro gratuito in sede.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><CreditCard size={28} /></div>
            <div>
              <h4>Pagamenti</h4>
              <p>Carta di Credito/Debito, PayPal, ricarica PostePay o Bonifico Bancario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CATEGORIE ────────────────────────────────────────────────────── */}
      <section className="categories section">
        <div className="container text-center">
          <h2 className="section-title mb-2">Esplora le Categorie</h2>
          <p className="section-subtitle mb-6">Trova il prodotto perfetto per ogni occasione</p>
          <div className="category-grid category-grid-6">
            {[
              { id: 'gifts',       name: 'RegaliAMO',        icon: Gift,       color: '#fdf0f7' },
              { id: 'party',       name: 'Feste & Party',    icon: Sparkles,   color: '#fff9fe' },
              { id: 'textiles',    name: 'Tessili & Arredo', icon: Package,    color: '#f8f4fc' },
              { id: 'apparel',     name: 'Abbigliamento',    icon: ShoppingBag,color: '#f0f8ff' },
              { id: 'promotional', name: 'Promozionale',     icon: Megaphone,  color: '#fff8f0' },
              { id: 'wedding',     name: 'Wedding',          icon: Heart,      color: '#fef5fa' },
            ].map(cat => (
              <Link to={`/shop?category=${cat.id}`} key={cat.id} className="category-card" style={{ background: cat.color }}>
                <div className="category-icon-wrap">
                  <cat.icon size={32} />
                </div>
                <h3>{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. BEST SELLER ──────────────────────────────────────────────────── */}
      <section className="section bg-secondary">
        <div className="container">
          <div className="offers-header">
            <div>
              <h2 className="section-title mb-2">I Più Venduti</h2>
              <p className="section-subtitle">I prodotti che i nostri clienti amano di più</p>
            </div>
            <Link to="/shop" className="btn btn-outline">Vedi Tutti</Link>
          </div>
          <div className="product-grid mt-6">
            {bestSellers.map((product, i) => (
              <ProductCard key={product.id} product={product} badge={bestSellerBadges[i]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. COME FUNZIONA ────────────────────────────────────────────────── */}
      <section className="how-it-works section">
        <div className="container text-center">
          <h2 className="section-title mb-2">Come Funziona</h2>
          <p className="section-subtitle mb-6">3 semplici passi per il tuo prodotto personalizzato</p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon-wrap"><MousePointer size={36} /></div>
              <h3>Scegli il Prodotto</h3>
              <p>Sfoglia il catalogo e trova il prodotto perfetto per te o per chi ami.</p>
            </div>
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon-wrap"><Paintbrush size={36} /></div>
              <h3>Personalizza</h3>
              <p>Aggiungi foto, nomi, date e frasi. Rendiamo unico ogni dettaglio.</p>
            </div>
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon-wrap"><PackageCheck size={36} /></div>
              <h3>Ricevi a Casa</h3>
              <p>Spedizione veloce e sicura. Il tuo prodotto arriva direttamente a casa tua!</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. OFFERTE SPECIALI ─────────────────────────────────────────────── */}
      {specialOffers.length > 0 && (
        <section className="special-offers section bg-secondary">
          <div className="container">
            <div className="offers-header">
              <div>
                <h2 className="section-title mb-2">Offerte Speciali</h2>
                <p className="section-subtitle">Regali unici per le persone che ami. Sorprendile ora!</p>
              </div>
              <Link to="/shop" className="btn btn-outline">Vedi Tutti</Link>
            </div>
            <div className="product-grid mt-6">
              {specialOffers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. BUNDLE / PACCHETTI ───────────────────────────────────────────── */}
      <section className="bundles-section section">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title mb-2">Pacchetti Risparmio</h2>
            <p className="section-subtitle mb-6">Combinazioni pensate per te a prezzo speciale</p>
          </div>
          <div className="bundles-grid">
            {bundles.map((b, i) => (
              <Link to={b.link} key={i} className="bundle-card" style={{ background: b.color }}>
                <div className="bundle-icon-wrap">
                  <b.icon size={32} color="var(--primary)" />
                </div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
                <span className="bundle-price">{b.price}</span>
                <span className="bundle-cta">Scopri <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. GADGET FINE FESTA BANNER ─────────────────────────────────────── */}
      <section className="promo-banner">
        <div className="promo-banner-inner">
          <div className="promo-banner-content">
            <span className="promo-eyebrow">Scopri i nostri</span>
            <h2 className="promo-title">Gadget Fine Festa</h2>
            <p className="promo-desc">Originali, utili e super convenienti. Perfetti per ogni occasione speciale!</p>
            <Link to="/shop?category=party" className="btn btn-white">
              ACQUISTA ADESSO <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. RECENSIONI ───────────────────────────────────────────────────── */}
      <section className="reviews section bg-secondary">
        <div className="container text-center">
          <h2 className="section-title mb-2">Cosa Dicono di Noi ⭐</h2>
          <p className="section-subtitle mb-6">Le opinioni reali dei nostri clienti</p>
          <div className="review-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <Quote size={24} className="review-quote-icon" />
                <div className="stars mb-3">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} size={18} fill="var(--accent)" color="var(--accent)" />)}
                </div>
                <p className="review-text">"{review.comment}"</p>
                <div className="review-author mt-4">
                  <div className="author-avatar">{review.name.charAt(0)}</div>
                  <div className="author-info">
                    <h4>{review.name}</h4>
                    <span>Acquirente Verificato ✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. CHI SIAMO ───────────────────────────────────────────────────── */}
      <section className="about-section section">
        <div className="container about-grid">
          <div className="about-text-block">
            <span className="hero-subtitle mb-2">Chi Siamo</span>
            <h2 className="section-title mb-4">Un mondo pensato per te</h2>
            <p className="about-tagline mb-4">Crea qualcosa di unico, originale e completamente tuo.</p>
            <p className="about-body mb-6">
              Stampiamo su quasi tutte le superfici, anche quelle più insolite. Che tu voglia
              creare gadget per feste originali, bomboniere personalizzate, cuscini su misura,
              tele canvas con le tue immagini preferite o calamite uniche, siamo qui per
              trasformare le tue idee in realtà. Ogni prodotto può essere completamente
              personalizzato nei colori, nel design e nel tema, così da diventare un oggetto
              esclusivo e irripetibile.
            </p>
            <Link to="/contact" className="btn btn-primary">Contattaci <ArrowRight size={18} /></Link>
          </div>
          <div className="about-quality-block">
            <div className="quality-card">
              <div className="quality-icon">
                <Star size={36} fill="var(--accent)" color="var(--accent)" />
              </div>
              <h3>Tutta la nostra qualità al tuo servizio</h3>
              <p>
                Utilizziamo stampanti e materiali all'avanguardia per rendere speciale ogni
                creazione. Durante l'acquisto, un membro del nostro Team ti accompagnerà
                passo passo, offrendoti consigli e supporto nella personalizzazione dei tuoi prodotti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. CTA FINALE ──────────────────────────────────────────────────── */}
      <section className="final-cta">
        <div className="container text-center">
          <h2>Pronto a creare qualcosa di unico?</h2>
          <p>Dai vita alle tue idee. Ogni prodotto è pensato e realizzato solo per te.</p>
          <div className="final-cta-actions">
            <Link to="/shop" className="btn btn-white btn-lg">
              Crea il tuo Prodotto Ora <Paintbrush size={20} />
            </Link>
            <a href="https://wa.me/390212345678?text=Ciao!%20Vorrei%20informazioni%20sui%20vostri%20prodotti%20personalizzati." className="btn btn-outline-white" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} /> Scrivici su WhatsApp
            </a>
          </div>
          <div className="final-cta-trust">
            <span><Shield size={16} /> Pagamenti sicuri</span>
            <span><Truck size={16} /> Spedizione in tutta Italia</span>
            <span><Headphones size={16} /> Supporto dedicato</span>
          </div>
        </div>
      </section>

      {/* ── 12. SOCIAL BAR ──────────────────────────────────────────────────── */}
      <section className="social-bar">
        <div className="container text-center">
          <p className="social-bar-text">Seguici sui social per ispirazioni e offerte esclusive!</p>
          <div className="social-bar-links">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="social-bar-link">
              <Camera size={20} /> Instagram
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="social-bar-link">
              <MessageCircle size={20} /> Facebook
            </a>
            <a href="https://wa.me/390212345678" target="_blank" rel="noopener noreferrer" className="social-bar-link">
              <MessageCircle size={20} /> WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;