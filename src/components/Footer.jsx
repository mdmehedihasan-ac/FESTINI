import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="logo-placeholder-footer mb-2">
            <h3>Smart Print Ciotta</h3>
          </div>
          <p className="footer-desc">
            Personalizziamo le tue emozioni. Idee regalo uniche, stampe di altissima qualità e cura sartoriale per ogni tuo evento.
          </p>
          <div className="social-links mt-4">
            <a href="#" aria-label="Social 1"><Globe size={20} /></a>
            <a href="#" aria-label="Social 2"><MessageCircle size={20} /></a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Link Utili</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Tutti i Prodotti</Link></li>
            <li><Link to="/contact">FAQ & Contatti</Link></li>
            <li><a href="#">Termini e Condizioni</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="footer-categories">
          <h4>Categorie</h4>
          <ul>
            <li><Link to="/shop?category=gifts">Idee Regalo</Link></li>
            <li><Link to="/shop?category=apparel">Abbigliamento</Link></li>
            <li><Link to="/shop?category=party">Feste ed Eventi</Link></li>
            <li><Link to="/shop?category=promotional">Materiale Promozionale</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contattaci</h4>
          <ul className="contact-list">
            <li>
              <MapPin size={18} className="contact-icon" />
              <span>Via Roma 123, Milano, Italia</span>
            </li>
            <li>
              <Phone size={18} className="contact-icon" />
              <span>+39 02 1234 5678</span>
            </li>
            <li>
              <Mail size={18} className="contact-icon" />
              <span>info@smartprintciotta.it</span>
            </li>
          </ul>
          <div className="payments mt-4">
            <p className="mb-1 text-sm font-semibold">Pagamenti Sicuri</p>
            <div className="payment-icons">
              <span className="pay-badge">Stripe</span>
              <span className="pay-badge">PayPal</span>
              <span className="pay-badge">Visa</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Smart Print Ciotta. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
