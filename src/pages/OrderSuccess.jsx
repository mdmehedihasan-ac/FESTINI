import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const { clearCart } = useCart();

  const orderNumber = params.get('order_number') || params.get('session_id') || '—';
  const method = params.get('method') || 'stripe';

  // Clear cart once on mount
  useEffect(() => {
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="success-page animate-fade-in">
      <div className="success-card">
        <div className="success-icon-wrap">
          <CheckCircle size={72} color="var(--primary)" />
        </div>

        <h1>Ordine Confermato!</h1>
        <p className="success-sub">
          Grazie per il tuo acquisto. Riceverai una email di conferma a breve.
        </p>

        {orderNumber !== '—' && (
          <div className="order-number-badge">
            <span>Numero Ordine</span>
            <strong>{orderNumber}</strong>
          </div>
        )}

        <div className="success-steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-text">
              <strong>Email di conferma</strong>
              <span>Ti abbiamo inviato una email di riepilogo</span>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-text">
              <strong>Produzione</strong>
              <span>Il tuo prodotto personalizzato è in lavorazione (2-3 gg)</span>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-text">
              <strong>Spedizione</strong>
              <span>Riceverai il tracking una volta spedito</span>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <Link to="/shop" className="btn btn-primary">
            <ShoppingBag size={18} /> Continua lo Shopping
          </Link>
          <Link to="/contact" className="btn btn-outline">
            <Mail size={18} /> Hai Domande?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
