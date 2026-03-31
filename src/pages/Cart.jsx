import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { items, totalCount, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

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
            <span>Spedizione stimata</span>
            <span>€4,99</span>
          </div>
          <div className="summary-row summary-total">
            <span>Totale</span>
            <span>€{(totalPrice + 4.99).toFixed(2)}</span>
          </div>

          <p className="summary-note">La spedizione definitiva viene calcolata al checkout.</p>

          <button
            className="btn btn-primary checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Procedi al Checkout <ArrowRight size={18} />
          </button>

          <Link to="/shop" className="btn btn-outline continue-btn">
            ← Continua lo Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
