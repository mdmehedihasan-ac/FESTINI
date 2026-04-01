import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  ShieldCheck, CreditCard, Loader, Truck, ArrowLeft, Copy, CheckCircle,
  ChevronDown, ChevronUp, Tag, User, MapPin, Package, Lock, Phone, Mail,
  ArrowRight, Zap,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Checkout.css';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

const POSTEPAY_NUMBER = '4023 6009 XXXX XXXX';
const POSTEPAY_HOLDER = 'Smart Print Ciotta';
const WHATSAPP_NUMBER = '393474826428';

const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Spedizione Standard', desc: '5–7 giorni lavorativi',           price: 4.99 },
  { id: 'express',  label: 'Spedizione Express',  desc: '2–3 giorni lavorativi',           price: 9.99, badge: 'Più veloce' },
  { id: 'pickup',   label: 'Ritiro in Sede',       desc: 'Via Duca della Verdura, Palermo', price: 0,    badge: 'Gratuito' },
];

const COUPON_CODES = {
  BENVENUTO10: 0.10,
  FESTINI15:   0.15,
  PROMO20:     0.20,
};

const STEPS = ['Informazioni', 'Spedizione', 'Pagamento'];

function validateInfo(f) {
  const e = {};
  if (!f.firstName?.trim())  e.firstName = 'Campo obbligatorio';
  if (!f.lastName?.trim())   e.lastName  = 'Campo obbligatorio';
  if (!f.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = 'Email non valida';
  if (!f.phone?.trim())      e.phone    = 'Campo obbligatorio';
  if (!f.address?.trim())    e.address  = 'Campo obbligatorio';
  if (!f.city?.trim())       e.city     = 'Campo obbligatorio';
  if (!f.zip?.trim() || !/^\d{5}$/.test(f.zip.trim()))
    e.zip = 'CAP non valido (5 cifre)';
  if (!f.province?.trim())   e.province = 'Campo obbligatorio';
  return e;
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  // ── State (all hooks must come before any early return) ─────────────────────
  const [step, setStep]               = useState(0);
  const [form, setForm]               = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zip: '', province: '', notes: '',
  });
  const [formErrors, setFormErrors]   = useState({});
  const [shipping, setShipping]       = useState('standard');
  const [insurance, setInsurance]     = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon]           = useState(null);
  const [couponError, setCouponError] = useState('');
  const [payMethod, setPayMethod]     = useState('card');
  const [copied, setCopied]           = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payError, setPayError]       = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Redirect if cart is empty (after all hooks)
  if (items.length === 0) { navigate('/cart'); return null; }

  // ── Derived totals ──────────────────────────────────────────────────────────
  const shippingOpt   = SHIPPING_OPTIONS.find(o => o.id === shipping);
  const shippingCost  = shippingOpt?.price ?? 4.99;
  const insuranceCost = insurance ? 2.99 : 0;
  const discount      = coupon ? totalPrice * coupon.pct : 0;
  const total         = Math.max(0, totalPrice - discount + shippingCost + insuranceCost);
  const totalItems    = items.reduce((s, i) => s + i.qty, 0);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (formErrors[k]) setFormErrors(e => ({ ...e, [k]: '' }));
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (COUPON_CODES[code]) {
      setCoupon({ code, pct: COUPON_CODES[code] });
      setCouponError('');
    } else {
      setCouponError('Codice non valido');
      setCoupon(null);
    }
  };

  const goNext = () => {
    if (step === 0) {
      const errors = validateInfo(form);
      if (Object.keys(errors).length) { setFormErrors(errors); return; }
      setFormErrors({});
    }
    setStep(s => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (step === 0) navigate('/cart');
    else { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  // ── Payment ─────────────────────────────────────────────────────────────────
  const payloadBase = () => ({
    items, customer: form,
    shippingMethod: shippingOpt?.label,
    shippingCost, insurance: insuranceCost,
    discount, total, coupon: coupon?.code || null,
  });

  const handleStripeCheckout = async () => {
    setStripeLoading(true); setPayError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore checkout Stripe');
      window.location.href = data.url;
    } catch (err) {
      setPayError(err.message);
      setStripeLoading(false);
    }
  };

  const createPayPalOrder = async () => {
    const res = await fetch('/api/create-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBase()),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore PayPal');
    return data.orderId;
  };

  const onPayPalApprove = async (data) => {
    const res = await fetch('/api/capture-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.orderID, ...payloadBase() }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Errore cattura PayPal');
    clearCart();
    navigate(`/order-success?order_number=${result.orderNumber}&method=paypal`);
  };

  const handleCopyPostePay = () => {
    navigator.clipboard.writeText(POSTEPAY_NUMBER.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const itemSummaryText = items.map(i => `${i.qty}x ${i.name}`).join(', ');
  const waMessage = encodeURIComponent(
    `Ciao! Ho effettuato una ricarica PostePay di €${total.toFixed(2)} per il mio ordine.\n` +
    `Prodotti: ${itemSummaryText}\n` +
    `Nome: ${form.firstName} ${form.lastName}\n` +
    `Email: ${form.email}\n` +
    `Allego la ricevuta.`
  );

  return (
    <div className="co-page animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="co-header">
        <div className="container co-header-inner">
          <button className="co-back-btn" onClick={goBack}>
            <ArrowLeft size={18} />
            <span>{step === 0 ? 'Carrello' : STEPS[step - 1]}</span>
          </button>
          <span className="co-brand">FESTINI</span>
          <div className="co-header-secure"><Lock size={14} /><span>Sicuro</span></div>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      <div className="co-progress-wrap">
        <div className="container">
          <div className="co-progress-steps">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`co-progress-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
                  <div className="co-progress-dot">
                    {i < step ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="co-progress-label">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`co-progress-line ${i < step ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="container co-layout">

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="co-left">

          {/* STEP 0 — Informazioni ──────────────────────────────────────── */}
          {step === 0 && (
            <div className="co-card">
              <h2 className="co-section-title"><User size={20} /> Informazioni personali</h2>
              <div className="co-form-grid">
                <div className={`co-field ${formErrors.firstName ? 'has-error' : ''}`}>
                  <label>Nome *</label>
                  <input type="text" placeholder="Mario"
                    value={form.firstName} onChange={e => setField('firstName', e.target.value)} />
                  {formErrors.firstName && <span className="co-field-err">{formErrors.firstName}</span>}
                </div>
                <div className={`co-field ${formErrors.lastName ? 'has-error' : ''}`}>
                  <label>Cognome *</label>
                  <input type="text" placeholder="Rossi"
                    value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
                  {formErrors.lastName && <span className="co-field-err">{formErrors.lastName}</span>}
                </div>
                <div className={`co-field co-field-full ${formErrors.email ? 'has-error' : ''}`}>
                  <label>Email *</label>
                  <div className="co-input-icon">
                    <Mail size={16} />
                    <input type="email" placeholder="mario.rossi@email.it"
                      value={form.email} onChange={e => setField('email', e.target.value)} />
                  </div>
                  {formErrors.email && <span className="co-field-err">{formErrors.email}</span>}
                </div>
                <div className={`co-field co-field-full ${formErrors.phone ? 'has-error' : ''}`}>
                  <label>Telefono *</label>
                  <div className="co-input-icon">
                    <Phone size={16} />
                    <input type="tel" placeholder="+39 333 1234567"
                      value={form.phone} onChange={e => setField('phone', e.target.value)} />
                  </div>
                  {formErrors.phone && <span className="co-field-err">{formErrors.phone}</span>}
                </div>
              </div>

              <h2 className="co-section-title" style={{ marginTop: '2rem' }}>
                <MapPin size={20} /> Indirizzo di spedizione
              </h2>
              <div className="co-form-grid">
                <div className={`co-field co-field-full ${formErrors.address ? 'has-error' : ''}`}>
                  <label>Via e N° civico *</label>
                  <input type="text" placeholder="Via Roma, 12"
                    value={form.address} onChange={e => setField('address', e.target.value)} />
                  {formErrors.address && <span className="co-field-err">{formErrors.address}</span>}
                </div>
                <div className={`co-field ${formErrors.city ? 'has-error' : ''}`}>
                  <label>Città *</label>
                  <input type="text" placeholder="Palermo"
                    value={form.city} onChange={e => setField('city', e.target.value)} />
                  {formErrors.city && <span className="co-field-err">{formErrors.city}</span>}
                </div>
                <div className={`co-field ${formErrors.zip ? 'has-error' : ''}`}>
                  <label>CAP *</label>
                  <input type="text" placeholder="90100" maxLength={5}
                    value={form.zip} onChange={e => setField('zip', e.target.value)} />
                  {formErrors.zip && <span className="co-field-err">{formErrors.zip}</span>}
                </div>
                <div className={`co-field ${formErrors.province ? 'has-error' : ''}`}>
                  <label>Provincia *</label>
                  <input type="text" placeholder="PA" maxLength={2}
                    value={form.province} onChange={e => setField('province', e.target.value.toUpperCase())} />
                  {formErrors.province && <span className="co-field-err">{formErrors.province}</span>}
                </div>
                <div className="co-field co-field-full">
                  <label>Note sull'ordine <span className="co-label-opt">(opzionale)</span></label>
                  <textarea
                    placeholder="Citofono, piano, istruzioni di consegna, dettagli personalizzazione…"
                    rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Spedizione ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="co-card">
              <h2 className="co-section-title"><Truck size={20} /> Metodo di spedizione</h2>
              <div className="co-shipping-list">
                {SHIPPING_OPTIONS.map(opt => (
                  <label key={opt.id} className={`co-shipping-opt ${shipping === opt.id ? 'active' : ''}`}>
                    <input type="radio" name="shipping" value={opt.id}
                      checked={shipping === opt.id} onChange={() => setShipping(opt.id)} />
                    <div className="co-shipping-radio-dot" />
                    <div className="co-shipping-info">
                      <span className="co-shipping-name">
                        {opt.label}
                        {opt.badge && <span className="co-shipping-badge">{opt.badge}</span>}
                      </span>
                      <span className="co-shipping-desc">{opt.desc}</span>
                    </div>
                    <span className="co-shipping-price">
                      {opt.price === 0
                        ? <strong className="co-free">Gratis</strong>
                        : `€${opt.price.toFixed(2)}`}
                    </span>
                  </label>
                ))}
              </div>

              <label className={`co-insurance ${insurance ? 'active' : ''}`}>
                <input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)} />
                <div className="co-insurance-icon-wrap"><ShieldCheck size={22} /></div>
                <div className="co-insurance-text">
                  <span className="co-insurance-title">Assicurazione Spedizione</span>
                  <span className="co-insurance-desc">Rimborso totale in caso di smarrimento o danno durante la consegna.</span>
                </div>
                <span className="co-insurance-price">+€2,99</span>
                <div className="co-insurance-check">{insurance && <CheckCircle size={18} />}</div>
              </label>
            </div>
          )}

          {/* STEP 2 — Pagamento ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="co-card">
              <h2 className="co-section-title"><CreditCard size={20} /> Metodo di pagamento</h2>

              {payError && <div className="co-pay-error">{payError}</div>}

              <div className="co-pay-tabs">
                {[
                  { id: 'card',     label: 'Carta',    icon: <CreditCard size={16} /> },
                  { id: 'paypal',   label: 'PayPal',   icon: <img src="https://www.paypalobjects.com/webstatic/i/logo/rebrand/ppcom.svg" alt="PayPal" height="14" /> },
                  { id: 'postepay', label: 'PostePay', icon: <span className="co-pp-icon">PP</span> },
                  { id: 'bonifico', label: 'Bonifico', icon: <Zap size={16} /> },
                ].map(m => (
                  <button key={m.id}
                    className={`co-pay-tab ${payMethod === m.id ? 'active' : ''}`}
                    onClick={() => { setPayMethod(m.id); setPayError(''); }}
                  >
                    {m.icon}<span>{m.label}</span>
                  </button>
                ))}
              </div>

              {payMethod === 'card' && (
                <div className="co-pay-panel">
                  <p className="co-pay-desc">Verrai reindirizzato alla pagina sicura di Stripe. Accettiamo Visa, Mastercard, American Express e Maestro.</p>
                  <div className="co-card-logos">
                    {['Visa', 'Mastercard', 'Amex', 'Maestro'].map(l => (
                      <span key={l} className="co-card-badge">{l}</span>
                    ))}
                  </div>
                  <button className="btn btn-primary co-pay-btn" onClick={handleStripeCheckout} disabled={stripeLoading || !stripePromise}>
                    {stripeLoading
                      ? <><Loader className="animate-spin" size={18} /> Reindirizzamento…</>
                      : <><Lock size={16} /> Paga €{total.toFixed(2)} in sicurezza</>}
                  </button>
                  {!stripePromise && <p className="co-pay-warn">⚠️ Stripe non configurato (VITE_STRIPE_PUBLISHABLE_KEY mancante).</p>}
                </div>
              )}

              {payMethod === 'paypal' && (
                <div className="co-pay-panel">
                  <p className="co-pay-desc">Paga con il tuo account PayPal o con carta tramite PayPal. Protezione acquirente inclusa.</p>
                  {paypalClientId ? (
                    <PayPalScriptProvider options={{ 'client-id': paypalClientId, currency: 'EUR', intent: 'capture' }}>
                      <PayPalButtons
                        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onError={err => { console.error(err); setPayError('Errore PayPal. Riprova o usa un altro metodo.'); }}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <p className="co-pay-warn">⚠️ PayPal non configurato (VITE_PAYPAL_CLIENT_ID mancante).</p>
                  )}
                </div>
              )}

              {payMethod === 'postepay' && (
                <div className="co-pay-panel">
                  <p className="co-pay-desc">Ricarica la PostePay di esattamente <strong>€{total.toFixed(2)}</strong> e inviaci la ricevuta via WhatsApp per confermare l'ordine.</p>
                  <div className="co-info-card">
                    <div className="co-info-row">
                      <span className="co-info-label">Numero carta</span>
                      <div className="co-info-value-row">
                        <span className="co-info-value">{POSTEPAY_NUMBER}</span>
                        <button className="co-copy-btn" onClick={handleCopyPostePay} aria-label="Copia">
                          {copied ? <CheckCircle size={15} color="#2e7d32" /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                    <div className="co-info-row">
                      <span className="co-info-label">Intestatario</span>
                      <span className="co-info-value">{POSTEPAY_HOLDER}</span>
                    </div>
                    <div className="co-info-row">
                      <span className="co-info-label">Importo esatto</span>
                      <span className="co-info-value co-info-amount">€{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn co-pay-btn co-wa-btn">
                    Invia Ricevuta su WhatsApp
                  </a>
                </div>
              )}

              {payMethod === 'bonifico' && (
                <div className="co-pay-panel">
                  <p className="co-pay-desc">Effettua un bonifico con i dati indicati. L'ordine viene confermato alla ricezione (1–2 gg lavorativi).</p>
                  <div className="co-info-card">
                    <div className="co-info-row"><span className="co-info-label">Intestatario</span><span className="co-info-value">Smart Print Ciotta</span></div>
                    <div className="co-info-row"><span className="co-info-label">IBAN</span><span className="co-info-value">IT60 X054 2811 1010 0000 0123 456</span></div>
                    <div className="co-info-row"><span className="co-info-label">Banca</span><span className="co-info-value">Banca Sella</span></div>
                    <div className="co-info-row"><span className="co-info-label">Causale</span><span className="co-info-value">Ordine FESTINI – {form.lastName || 'Cognome'} {form.firstName || 'Nome'}</span></div>
                    <div className="co-info-row"><span className="co-info-label">Importo</span><span className="co-info-value co-info-amount">€{total.toFixed(2)}</span></div>
                  </div>
                  <p className="co-pay-desc" style={{ marginTop: '0.75rem' }}>
                    Invia la contabile a <strong>ordini@festini.it</strong> o tramite WhatsApp al termine del bonifico.
                  </p>
                </div>
              )}

              <p className="co-terms">
                <Lock size={12} />
                Completando l'ordine accetti i nostri{' '}
                <Link to="/contact" className="co-terms-link">Termini di servizio</Link> e la{' '}
                <Link to="/contact" className="co-terms-link">Privacy Policy</Link>.
              </p>
            </div>
          )}

          {/* Bottom navigation ──────────────────────────────────────────── */}
          <div className="co-bottom-nav">
            <button className="btn btn-outline co-btn-back" onClick={goBack}>
              <ArrowLeft size={16} />
              {step === 0 ? 'Carrello' : STEPS[step - 1]}
            </button>
            {step < 2 && (
              <button className="btn btn-primary co-btn-next" onClick={goNext}>
                {STEPS[step + 1]} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── Right column: Order Summary ───────────────────────────────── */}
        <div className="co-right">
          <div className="co-summary">

            {/* Mobile toggle */}
            <button className="co-summary-toggle" onClick={() => setSummaryOpen(o => !o)}>
              <span className="co-summary-toggle-left">
                {summaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <Package size={16} />
                Riepilogo ({totalItems} articol{totalItems === 1 ? 'o' : 'i'})
              </span>
              <span className="co-summary-toggle-price">€{total.toFixed(2)}</span>
            </button>

            <div className={`co-summary-body ${summaryOpen ? 'co-summary-open' : ''}`}>

              {/* Products list */}
              <div className="co-items-list">
                {items.map(item => (
                  <div key={item._key} className="co-item">
                    <div className="co-item-img">
                      {item.image
                        ? <img src={item.image} alt={item.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
                        : <Package size={20} color="var(--primary)" />}
                      <span className="co-item-qty">{item.qty}</span>
                    </div>
                    <div className="co-item-info">
                      <span className="co-item-name">{item.name}</span>
                      {item.personalization && Object.keys(item.personalization).length > 0 && (
                        <span className="co-item-personal">
                          {Object.entries(item.personalization).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </span>
                      )}
                    </div>
                    <span className="co-item-price">€{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="co-coupon">
                <div className="co-coupon-row">
                  <div className="co-coupon-input">
                    <Tag size={14} />
                    <input type="text" placeholder="Codice sconto"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    />
                  </div>
                  <button className="btn btn-outline co-coupon-btn" onClick={applyCoupon}>Applica</button>
                </div>
                {couponError && <p className="co-coupon-err">{couponError}</p>}
                {coupon && <p className="co-coupon-ok"><CheckCircle size={13} /> Sconto {(coupon.pct * 100).toFixed(0)}% applicato!</p>}
              </div>

              {/* Totals */}
              <div className="co-totals">
                <div className="co-total-row"><span>Subtotale</span><span>€{totalPrice.toFixed(2)}</span></div>
                {coupon && (
                  <div className="co-total-row co-total-discount">
                    <span>Sconto ({coupon.code})</span><span>−€{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="co-total-row">
                  <span>{shippingOpt?.label || 'Spedizione'}</span>
                  <span>{shippingCost === 0 ? <span className="co-free">Gratuita</span> : `€${shippingCost.toFixed(2)}`}</span>
                </div>
                {insurance && (
                  <div className="co-total-row"><span>Assicurazione</span><span>€{insuranceCost.toFixed(2)}</span></div>
                )}
                <div className="co-total-final"><span>Totale</span><span>€{total.toFixed(2)}</span></div>
              </div>

              {/* Trust */}
              <div className="co-trust">
                <div className="co-trust-item"><ShieldCheck size={14} color="var(--primary)" /><span>Pagamento sicuro SSL</span></div>
                <div className="co-trust-item"><Truck size={14} color="var(--primary)" /><span>Spedizione in tutta Italia</span></div>
                <div className="co-trust-item"><Lock size={14} color="var(--primary)" /><span>Dati crittografati</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
