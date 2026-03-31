import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShieldCheck, CreditCard, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Checkout.css';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // ── Stripe Checkout ───────────────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    setError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore checkout Stripe');
      }

      // Redirect to Stripe Hosted Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setStripeLoading(false);
    }
  };

  // ── PayPal Handlers ───────────────────────────────────────────────────────
  const createPayPalOrder = async () => {
    const res = await fetch('/api/create-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore PayPal');
    return data.orderId;
  };

  const onPayPalApprove = async (data) => {
    const res = await fetch('/api/capture-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.orderID, items }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Errore cattura PayPal');

    clearCart();
    navigate(`/order-success?order_number=${result.orderNumber}&method=paypal`);
  };

  const onPayPalError = (err) => {
    console.error('PayPal error:', err);
    setError('Si è verificato un errore con PayPal. Riprova o usa la carta di credito.');
  };

  const shipping = 4.99;
  const total = totalPrice + shipping;

  return (
    <div className="checkout-page animate-fade-in">
      <div className="checkout-header">
        <div className="container">
          <h1>Checkout</h1>
        </div>
      </div>

      <div className="container checkout-container">
        {/* Order review */}
        <div className="checkout-items">
          <h3>Riepilogo Ordine</h3>
          {items.map(item => (
            <div key={item._key} className="checkout-item">
              <img src={item.image} alt={item.name} />
              <div className="checkout-item-info">
                <span>{item.name}</span>
                {item.personalization && Object.keys(item.personalization).length > 0 && (
                  <small className="checkout-personalization">
                    {Object.entries(item.personalization)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </small>
                )}
              </div>
              <span className="checkout-item-qty">x{item.qty}</span>
              <span className="checkout-item-price">€{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}

          <div className="checkout-totals">
            <div className="total-row">
              <span>Subtotale</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Spedizione</span>
              <span>da €{shipping.toFixed(2)}</span>
            </div>
            <div className="total-row total-final">
              <span>Totale</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="checkout-payment">
          <h3>Metodo di Pagamento</h3>

          {error && (
            <div className="checkout-error">
              {error}
            </div>
          )}

          {/* Stripe */}
          <div className="payment-section">
            <div className="payment-section-title">
              <CreditCard size={20} />
              <span>Carta di Credito / Debito</span>
            </div>
            <p className="payment-desc">
              Sarai reindirizzato alla pagina di pagamento sicura di Stripe. Accettiamo Visa, Mastercard, American Express.
            </p>
            <button
              className="btn btn-primary payment-btn"
              onClick={handleStripeCheckout}
              disabled={stripeLoading || !stripePromise}
            >
              {stripeLoading ? (
                <><Loader className="animate-spin" size={18} /> Caricamento...</>
              ) : (
                <>Paga con Carta — €{total.toFixed(2)}</>
              )}
            </button>
            {!stripePromise && (
              <p className="payment-warn">⚠️ Stripe non configurato. Aggiungi VITE_STRIPE_PUBLISHABLE_KEY.</p>
            )}
          </div>

          <div className="payment-divider"><span>oppure</span></div>

          {/* PayPal */}
          <div className="payment-section">
            <div className="payment-section-title">
              <img src="https://www.paypalobjects.com/webstatic/i/logo/rebrand/ppcom.svg" alt="PayPal" height="22" />
              <span>PayPal</span>
            </div>
            {paypalClientId ? (
              <PayPalScriptProvider options={{
                'client-id': paypalClientId,
                currency: 'EUR',
                intent: 'capture',
              }}>
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                  createOrder={createPayPalOrder}
                  onApprove={onPayPalApprove}
                  onError={onPayPalError}
                />
              </PayPalScriptProvider>
            ) : (
              <p className="payment-warn">⚠️ PayPal non configurato. Aggiungi VITE_PAYPAL_CLIENT_ID.</p>
            )}
          </div>

          <div className="checkout-trust">
            <ShieldCheck size={16} color="var(--primary)" />
            <span>Pagamento 100% sicuro. I tuoi dati sono protetti con crittografia SSL.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
