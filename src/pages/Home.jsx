import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, ShoppingBag, Star, Heart, Loader, Truck, CreditCard, Paintbrush, Sparkles, Megaphone, Package } from 'lucide-react';
import './Home.css';

const categoryIconMap = {
  gifts: Gift,
  textiles: Package,
  party: Sparkles,
  apparel: ShoppingBag,
  promotional: Megaphone,
  wedding: Heart,
};

const categoryColorMap = {
  gifts:       { bg: 'linear-gradient(135deg,#fdf0f7,#f9dff3)', color: '#B50A74' },
  textiles:    { bg: 'linear-gradient(135deg,#f4f0fd,#e8def8)', color: '#7c3aed' },
  party:       { bg: 'linear-gradient(135deg,#fff8e1,#ffecb3)', color: '#f59e0b' },
  apparel:     { bg: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', color: '#16a34a' },
  promotional: { bg: 'linear-gradient(135deg,#e3f2fd,#bbdefb)', color: '#1d4ed8' },
  wedding:     { bg: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', color: '#e91e63' },
};

const ProductPlaceholder = ({ category }) => {
  const Icon = categoryIconMap[category] || Gift;
  const colors = categoryColorMap[category] || categoryColorMap.gifts;
  return (
    <div className="product-img-placeholder" style={{ background: colors.bg }}>
      <Icon size={44} color={colors.color} />
    </div>
  );
};

const ProductCard = ({ product }) => (
  <div className="product-card">
    <div className="product-image-container">
      {product.isSpecialOffer && <span className="badge-offer">Promo</span>}
      {product.image
        ? <img src={product.image} alt={product.name} className="product-img" onError={e => { e.currentTarget.style.display='none'; }} />
        : <ProductPlaceholder category={product.category} />}
      <div className="product-overlay">
        <Link to={`/product/${product.id}`} className="btn btn-primary">Personalizza</Link>
      </div>
    </div>
    <div className="product-info">
      <span className="product-category">{product.subcategory || product.category}</span>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">€{product.price.toFixed(2)}</p>
    </div>
  </div>
);

const Home = () => {
  const [specialOffers, setSpecialOffers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Loader className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="home-page animate-fade-in">

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
              <Link to="/shop" className="btn btn-primary">
                Scopri il Catalogo <ArrowRight size={18} />
              </Link>
              <Link to="/shop?category=party" className="btn btn-outline">
                Gadget Fine Festa <Sparkles size={18} />
              </Link>
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

      {/* ── 3. OFFERTE SPECIALI ─────────────────────────────────────────────── */}
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

      {/* ── 4. GADGET FINE FESTA BANNER ─────────────────────────────────────── */}
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

      {/* ── 5. NUOVI ARRIVI ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="offers-header">
            <div>
              <h2 className="section-title mb-2">Nuovi Arrivi</h2>
              <p className="section-subtitle">Le ultime novità del nostro catalogo</p>
            </div>
            <Link to="/shop" className="btn btn-outline">Vedi Tutti</Link>
          </div>
          <div className="product-grid mt-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. I PIÙ VENDUTI ────────────────────────────────────────────────── */}
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
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CATEGORIE ────────────────────────────────────────────────────── */}
      <section className="categories section">
        <div className="container text-center">
          <h2 className="section-title mb-2">Non sai cosa cercare?</h2>
          <p className="section-subtitle mb-6">Inizia da qui! Scopri tutte le nostre categorie</p>
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

      {/* ── 8. UN MONDO PENSATO PER TE ──────────────────────────────────────── */}
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

      {/* ── 9. RECENSIONI ───────────────────────────────────────────────────── */}
      <section className="reviews section bg-secondary">
        <div className="container text-center">
          <h2 className="section-title mb-6">Cosa Dicono di Noi</h2>
          <div className="review-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="stars mb-3">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} size={18} fill="var(--accent)" color="var(--accent)" />)}
                </div>
                <p className="review-text">"{review.comment}"</p>
                <div className="review-author mt-4">
                  <div className="author-avatar">{review.name.charAt(0)}</div>
                  <div className="author-info">
                    <h4>{review.name}</h4>
                    <span>Acquirente Verificato</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
