import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Loader, MessageCircle, ArrowRight, Star, Upload, X, Camera, AlignLeft, Image as ImageIcon, Palette, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const EXAMPLE_VALUES = {
  'Nome': 'Marco',
  'Nome bambino/a': 'Sofia',
  'Nomi': 'Marco & Giulia',
  'Testo Personalizzato': 'Ti voglio bene!',
  'Dedica': 'Al miglior papà del mondo',
  'Frase': 'L\'amore è tutto',
  'Data': '14/02/2026',
  'Data di nascita': '01/03/2026',
  'Peso e altezza': '3.2 kg — 50 cm',
  'Tema grafico': 'Cuori',
  'Font': 'Corsivo elegante',
};

const PERSONALIZATION_TYPES = [
  {
    id: 'foto',
    label: 'FOTO',
    icon: Camera,
    desc: 'Carica la foto da utilizzare per la personalizzazione (tipo foto bambino ecc.)',
  },
  {
    id: 'foto_frase',
    label: 'FOTO + FRASE',
    icon: ImageIcon,
    desc: 'Carica la foto e scrivi il nome, l\'età e tutto ciò che vuoi come scritta nel prodotto',
  },
  {
    id: 'frase',
    label: 'FRASE',
    icon: AlignLeft,
    desc: 'Il nome, l\'età e tutto ciò che vuoi inserire come scritta nel prodotto',
  },
];

/* ── Styled file input ─────────────────────────────────────────────────────── */
const FileInput = ({ label, onChange }) => {
  const ref = useRef(null);
  const [fileName, setFileName] = useState('');

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onChange(file.name);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFileName('');
    onChange('');
    if (ref.current) ref.current.value = '';
  };

  return (
    <div className="file-input-wrap" onClick={() => ref.current?.click()}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="file-input-hidden"
        onChange={handleChange}
      />
      <div className="file-input-btn">
        <Upload size={18} />
        <span>{fileName ? 'Cambia foto' : 'Carica foto'}</span>
      </div>
      {fileName ? (
        <div className="file-input-preview">
          <span className="file-input-name">{fileName}</span>
          <button className="file-input-clear" onClick={handleClear} aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ) : (
        <span className="file-input-hint">JPG, PNG, WEBP — max 10 MB</span>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [qty, setQty] = useState(1);
  const [personType, setPersonType] = useState('');
  const [personFoto, setPersonFoto] = useState('');
  const [personFrase, setPersonFrase] = useState('');
  const [personTema, setPersonTema] = useState('');
  const [personData, setPersonData] = useState('');
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, allRes] = await Promise.all([
          fetch(`/api/product?id=${id}`),
          fetch('/api/products'),
        ]);
        if (!productRes.ok) throw new Error("Product not found");
        const data = await productRes.json();
        setProduct(data);

        const all = await allRes.json();
        const related = all
          .filter(p => p.category === data.category && p.id !== data.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Loader className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container text-center" style={{ padding: '8rem 0' }}>
        <h2>Prodotto non trovato</h2>
        <Link to="/shop" className="btn btn-primary mt-4">Torna al Catalogo</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    const personalization = {
      ...(personType && { tipo: PERSONALIZATION_TYPES.find(t => t.id === personType)?.label }),
      ...(personFoto && { foto: personFoto }),
      ...(personFrase && { frase: personFrase }),
      ...(personTema && { tema: personTema }),
      ...(personData && { dataConsegna: personData }),
    };
    addItem(product, qty, personalization);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-detail-page animate-fade-in">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link> /
          <Link to="/shop">Shop</Link> /
          <Link to={`/shop?category=${product.category.split(' ')[0]}`}>{product.category}</Link> /
          <span>{product.name}</span>
        </div>

        <div className="product-detail-container">

          {/* ── LEFT: Sticky Image ── */}
          <div className="product-gallery">
            <div className="main-image-wrapper">
              {product.isSpecialOffer && <span className="badge-offer-large">Novità</span>}
              <img src={product.image} alt={product.name} className="main-image" />
            </div>
            {/* Trust badges under image */}
            <div className="trust-badges-col">
              <div className="trust-badge-row">
                <Truck size={18} color="var(--primary)" />
                <span><strong>Spedizione Rapida</strong> — Standard o Express in Italia</span>
              </div>
              <div className="trust-badge-row">
                <ShieldCheck size={18} color="var(--primary)" />
                <span><strong>Pagamenti Sicuri</strong> — Carte, PayPal, PostePay</span>
              </div>
              <div className="trust-badge-row">
                <RotateCcw size={18} color="var(--primary)" />
                <span><strong>Qualità Garantita</strong> — Materiali Premium certificati</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Info + Form + CTA ── */}
          <div className="product-info-col">

            {/* Header */}
            <div className="p-header">
              <span className="p-category">{product.category}</span>
              <h1 className="p-title">{product.name}</h1>
              <div className="p-price-row">
                <span className="p-price">€{product.price.toFixed(2)}</span>
                {product.isSpecialOffer && <span className="p-badge-promo">In Promozione</span>}
              </div>
              <p className="p-desc">{product.description}</p>
            </div>

            <div className="p-divider" />

            {/* Personalization Section */}
            <div className="personalization-section">

              {/* Step 1 */}
              <div className="person-step-header">
                <span className="person-step-num">1</span>
                <div>
                  <h3 className="person-step-title">Tipo di Personalizzazione</h3>
                  <p className="personalization-hint">Scegli cosa vuoi aggiungere al prodotto.</p>
                </div>
              </div>
              <div className="person-type-grid">
                {PERSONALIZATION_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`person-type-card ${personType === type.id ? 'active' : ''}`}
                      onClick={() => setPersonType(type.id)}
                    >
                      <div className="person-type-icon-wrap"><Icon size={22} /></div>
                      <span className="person-type-label">{type.label}</span>
                      <span className="person-type-desc">{type.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Step 2: dynamic fields */}
              {personType && (
                <div className="person-form animate-fade-in">
                  <div className="person-step-header">
                    <span className="person-step-num">2</span>
                    <div>
                      <h3 className="person-step-title">Inserisci i Dati</h3>
                    </div>
                  </div>
                  {(personType === 'foto' || personType === 'foto_frase') && (
                    <div className="form-group">
                      <label>Carica la tua Foto</label>
                      <FileInput label="Foto" onChange={setPersonFoto} />
                    </div>
                  )}
                  {(personType === 'foto_frase' || personType === 'frase') && (
                    <div className="form-group">
                      <label>Nome / Età / Frase personalizzata</label>
                      <textarea
                        className="text-input"
                        rows={3}
                        placeholder="es. Sofia, 5 anni — La mia principessa del cuore"
                        value={personFrase}
                        onChange={e => setPersonFrase(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: tema + data */}
              <div className="person-step-header" style={{ marginTop: '1.5rem' }}>
                <span className="person-step-num">3</span>
                <div>
                  <h3 className="person-step-title">Tema & Consegna</h3>
                </div>
              </div>

              <div className="person-extra-row">
                <div className="form-group">
                  <label><Palette size={14} className="label-icon" />Tema della Grafica <span className="label-optional">opzionale</span></label>
                  <p className="field-hint">Tutti i prodotti sono personalizzabili! Se vuoi un tema diverso da quello in foto scrivilo qui.<br/><em>es. Spiderman, Frozen, Unicorni...</em></p>
                  <input type="text" className="text-input" placeholder="es. Spiderman, Frozen, Dinosauri..."
                    value={personTema} onChange={e => setPersonTema(e.target.value)} />
                </div>
                <div className="form-group">
                  <label><Calendar size={14} className="label-icon" />Data Evento / Consegna</label>
                  <p className="field-hint">Inserisci la data dell'evento così da poterci regolare con le consegne.</p>
                  <input type="date" className="text-input" value={personData}
                    onChange={e => setPersonData(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              {/* WhatsApp note */}
              <div className="whatsapp-note">
                <MessageCircle size={18} />
                <p><strong>Anteprima via WhatsApp:</strong> La bozza grafica verrà realizzata ed inviata tramite WhatsApp solo dopo ricevuto l'ordine e il pagamento.</p>
              </div>
            </div>

            {/* ── CTA Cart ── */}
            <div className="cart-cta-block">
              <div className="qty-selector">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <span className="qty-value">{qty}</span>
                <button onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button
                className={`btn ${added ? '' : 'btn-primary'} add-to-cart-btn`}
                style={{ background: added ? '#2e7d32' : '' }}
                onClick={handleAddToCart}
              >
                {added ? '✓ Aggiunto al Carrello!' : <><ShoppingCart size={22} /> Aggiungi al Carrello — €{(product.price * qty).toFixed(2)}</>}
              </button>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products">
            <h2 className="section-title mb-2">Potrebbe Piacerti Anche</h2>
            <p className="section-subtitle mb-6">Prodotti simili che potrebbero interessarti</p>
            <div className="related-grid">
              {relatedProducts.map(rp => (
                <Link to={`/product/${rp.id}`} key={rp.id} className="related-card">
                  <div className="related-img-wrap">
                    <img src={rp.image} alt={rp.name} />
                  </div>
                  <div className="related-info">
                    <h4>{rp.name}</h4>
                    <span className="related-price">€{rp.price.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;