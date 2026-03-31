import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Informazioni Generali', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [responseMsg, setResponseMsg] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  const handleNewsletter = async (e) => {
    e.preventDefault();
    setNewsletterStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      if (res.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
      }
    } catch {
      setNewsletterStatus('error');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus('loading');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setResponseMsg(data.message);
        setFormData({ name: '', email: '', subject: 'Informazioni Generali', message: '' });
      } else {
        setStatus('error');
        setResponseMsg(data.error || "Errore durante l'invio.");
      }
    } catch (err) {
      setStatus('error');
      setResponseMsg("Impossibile contattare il server.");
    }
  };

  return (
    <div className="contact-page animate-fade-in">
      <div className="container contact-container">
        {/* Contact Info */}
        <div className="contact-info-panel">
          <h1 className="mb-2">Parliamo del tuo prossimo progetto</h1>
          <p className="mb-6">Hai bisogno di assistenza o vuoi richiedere un preventivo personalizzato per un ordine di grandi quantità? Siamo a tua disposizione.</p>
          
          <div className="info-cards">
            <div className="info-card">
              <div className="icon-wrap">
                <Phone size={24} />
              </div>
              <div>
                <h3>Chiamaci</h3>
                <p>+39 02 1234 5678</p>
                <span>Lun - Ven: 09:00 - 18:00</span>
              </div>
            </div>
            
            <div className="info-card">
              <div className="icon-wrap">
                <Mail size={24} />
              </div>
              <div>
                <h3>Scrivici</h3>
                <p>info@smartprintciotta.it</p>
                <span>Rispondiamo in 24h</span>
              </div>
            </div>

            <div className="info-card">
              <div className="icon-wrap">
                <MapPin size={24} />
              </div>
              <div>
                <h3>Vieni a trovarci</h3>
                <p>Via Roma 123, 20100</p>
                <span>Milano (MI), Italia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-panel">
          <div className="form-wrapper glass-form">
            <h2 className="mb-4">Inviaci un messaggio</h2>
            
            {status === 'success' && (
              <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {responseMsg}
              </div>
            )}
            
            {status === 'error' && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {responseMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid-form">
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="text-input" placeholder="Es. Mario Rossi" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="text-input" placeholder="es. mario@email.com" required />
                </div>
              </div>
              <div className="form-group">
                <label>Argomento</label>
                <select name="subject" value={formData.subject} onChange={handleChange} className="select-input">
                  <option>Informazioni Generali</option>
                  <option>Supporto Ordine</option>
                  <option>Preventivo Personalizzato</option>
                  <option>Altro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Messaggio</label>
                <textarea name="message" value={formData.message} onChange={handleChange} className="text-input" rows="5" placeholder="Scrivi qui i dettagli della tua richiesta..." required></textarea>
              </div>
              <button type="submit" className="btn btn-primary mt-2 w-100" disabled={status === 'loading'}>
                {status === 'loading' ? <Loader className="animate-spin" size={18} /> : <>Invia Richiesta <Send size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ & Newsletter */}
      <div className="bg-secondary section">
        <div className="container">
          <div className="faq-newsletter-grid">
            <div className="faq-section">
              <h2 className="mb-4 text-primary">FAQ</h2>
              <div className="faq-item">
                <h4>Quali sono i tempi di spedizione?</h4>
                <p>La spedizione standard richiede 3-5 giorni lavorativi. La spedizione Express (disponibile in checkout) richiede 1-2 giorni.</p>
              </div>
              <div className="faq-item">
                <h4>Quali metodi di pagamento accettate?</h4>
                <p>Accettiamo carte di credito (Visa, Mastercard, Amex), PayPal e bonifico bancario anticipato.</p>
              </div>
              <div className="faq-item">
                <h4>Posso fare un reso su un prodotto personalizzato?</h4>
                <p>Sui prodotti personalizzati il reso non è disponibile a meno che non vi siano difetti di produzione o stampa evidenti.</p>
              </div>
            </div>

            <div className="newsletter-section">
              <div className="newsletter-card">
                <h3>Resta Aggiornato</h3>
                <p>Iscriviti alla nostra newsletter per ricevere offerte esclusive e sconti per le festività.</p>
                <form onSubmit={handleNewsletter} className="newsletter-form mt-4">
                  <input type="email" name="newsletterEmail" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="La tua email..." className="text-input" required />
                  <button className="btn btn-primary" disabled={newsletterStatus === 'loading'}>Iscriviti</button>
                  {newsletterStatus === 'success' && <p style={{color:'#2e7d32', marginTop:'0.5rem', fontSize:'0.875rem'}}>Iscrizione completata!</p>}
                  {newsletterStatus === 'error' && <p style={{color:'#c62828', marginTop:'0.5rem', fontSize:'0.875rem'}}>Errore. Riprova.</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
