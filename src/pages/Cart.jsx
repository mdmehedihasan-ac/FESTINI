import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield, Truck, Info, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const SHIPPING_BASE = 4.99;
const SHIPPING_EXTRA = 5.00; // extra for posters/torte scenografiche
const INSURANCE_COST = 2.99;

const EXTRA_SHIPPING_CATEGORIES = ['poster', 'torte scenografiche', 'canvas', 'tela'];

/* ── Cross-sell mini card ──────────────────────────────────────────────────── */
const CrossSellCard = ({ product }) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    addItem(product, 1, {});
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <div className="crosssell-card">
      <Link to={`/product/${product.id}`} className="crosssell-img-wrap">
        {product.image
          ? <img src={product.image} alt={product.name} />
          : <div className="crosssell-img-placeholder"><ShoppingBag size={28} color="var(--primary)" /></div>
        }
      </Link>
      <div className="crosssell-info">
        <Link to={`/product/${product.id}`} className="crosssell-name">{product.name}</Link>
        <p className="crosssell-price">€{product.price.toFixed(2)}</p>
        <button
          className={`btn crosssell-btn ${added ? 'crosssell-btn-added' : 'btn-outline'}`}
          onClick={handleAdd}
        >
          {added ? '✓ Aggiunto!' : '+ Aggiungi'}
        </button>
      </div>
    </div>
  );
};

const Cart = () => {
  const { items, totalCount, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [shippingInsurance, setShippingInsurance] = useState(false);
  const [crossSell, setCrossSell] = useState([]);

  // Fetch cross-sell suggestions: products NOT already in cart, from same categories
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(all => {
        const cartIds = new Set(items.map(i => i.id));
        const cartCategories = [...new Set(items.map(i => i.category))];
        // Prefer same-category products; fall back to any
        const sameCat = all.filter(p => !cartIds.has(p.id) && cartCategories.includes(p.category));
        const picks = sameCat.length >= 3 ? sameCat : all.filter(p => !cartIds.has(p.id));
        // Shuffle lightly and take 4
        setCrossSell(picks.sort(() => 0.3 - Math.random()).slice(0, 4));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="cart-page animate-fade-in">
        <div className="container cart-empty">
          <ShoppingBag size={64} color="var(--primary)" />
          <h2>Il tuo carrello è vuoto</h2>
          <p>Aggiungi qualche prodotto prima di procedere all'acquisto.</p>
          <Link to="/shop" className="btn btn-primary mt-4">
            Vai al Catalogo <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Check if any item requires extra shipping
  const hasExtraShipping = items.some(item => {
    const sub = (item.subcategory || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return EXTRA_SHIPPING_CATEGORIES.some(cat => sub.includes(cat) || name.includes(cat));
  });

  const shipping = SHIPPING_BASE + (hasExtraShipping ? SHIPPING_EXTRA : 0);
  const insurance = shippingInsurance ? INSURANCE_COST : 0;
  const total = totalPrice + shipping + insurance;

  return (
    <div className="cart-page animate-fade-in">
      <div className="cart-header">
        <div className="container">
          <h1>Il tuo Carrello</h1>
          <p>{totalCount} {totalCount === 1 ? 'articolo' : 'articoli'}</p>
        </div>
      </div>

      <div className="container cart-container">
        {/* Items list */}
        <div className="cart-items">
          {items.map(item => (
            <div key={item._key} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-image" />
              <div className="cart-item-info">
                <span className="cart-item-category">{item.category}</span>
                <h3 className="cart-item-name">{item.name}</h3>
                {item.personalization && Object.keys(item.personalization).length > 0 && (
                  <div className="cart-item-personalization">
                    {Object.entries(item.personalization).map(([key, val]) => val && (
                      <span key={key} className="pers-tag">{key}: <strong>{val}</strong></span>
                    ))}
                  </div>
                )}
                <p className="cart-item-unit-price">€{item.price.toFixed(2)} cad.</p>
              </div>
              <div className="cart-item-actions">
                <div className="qty-selector">
                  <button onClick={() => updateQty(item._key, item.qty - 1)} aria-label="Diminuisci">
                    <Minus size={14} />
                  </button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item._key, item.qty + 1)} aria-label="Aumenta">
                    <Plus size={14} />
                  </button>
                </div>
                <p className="cart-item-subtotal">€{(item.price * item.qty).toFixed(2)}</p>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item._key)}
                  aria-label="Rimuovi"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button className="btn-link clear-cart" onClick={clearCart}>
            Svuota carrello
          </button>
        </div>

        {/* Order summary */}
        <div className="cart-summary">
          <h3>Riepilogo Ordine</h3>

          <div className="summary-row">
            <span>Subtotale ({totalCount} art.)</span>
            <span>€{totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>
              Spedizione
              {hasExtraShipping && (
                <span className="extra-shipping-note">
                  <Info size={14} /> Include supplemento
                </span>
              )}
            </span>
            <span>€{shipping.toFixed(2)}</span>
          </div>

          {hasExtraShipping && (
            <div className="shipping-extra-info">
              <Truck size={16} />
              <span>Supplemento spedizione €{SHIPPING_EXTRA.toFixed(2)} per poster/torte scenografiche (dimensioni speciali).</span>
            </div>
          )}

          {/* Shipping Insurance */}
          <label className="insurance-toggle">
            <input
              type="checkbox"
              checked={shippingInsurance}
              onChange={e => setShippingInsurance(e.target.checked)}
            />
            <div className="insurance-info">
              <Shield size={16} color="var(--primary)" />
              <div>
                <strong>Assicurazione spedizione</strong>
                <span>Protezione completa per il tuo ordine</span>
              </div>
            </div>
            <span className="insurance-price">+€{INSURANCE_COST.toFixed(2)}</span>
          </label>

          <div className="summary-row summary-total">
            <span>Totale</span>
            <span>€{total.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary checkout-btn"
            onClick={() => navigate('/checkout', { state: { shippingInsurance } })}
          >
            Procedi al Checkout <ArrowRight size={18} />
          </button>

          <div className="cart-payment-methods">
            <p>Accettiamo</p>
            <div className="payment-icons-row">
              <span className="pay-badge">Visa</span>
              <span className="pay-badge">Mastercard</span>
              <span className="pay-badge">PayPal</span>
              <span className="pay-badge">PostePay</span>
            </div>
          </div>

          <Link to="/shop" className="btn btn-outline continue-btn">
            ← Continua lo Shopping
          </Link>
        </div>
      </div>

      {/* ── Cross-sell section ────────────────────────────────────────── */}
      {crossSell.length > 0 && (
        <div className="crosssell-section">
          <div className="crosssell-header">
            <Sparkles size={20} color="var(--accent)" />
            <h3>Potrebbe piacerti anche</h3>
          </div>
          <div className="crosssell-grid">
            {crossSell.map(p => <CrossSellCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;