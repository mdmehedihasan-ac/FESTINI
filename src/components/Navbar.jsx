import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Search, Gift, Sparkles, Package, ShoppingBag, Megaphone, Heart, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const CATALOG_CATEGORIES = [
  {
    id: 'gifts', label: 'RegaliAMO', icon: Gift, color: '#B50A74',
    sub: ['Tazze Personalizzate', 'Cuscini', 'Calamite', 'Portafoto', 'Candele'],
  },
  {
    id: 'party', label: 'Feste & Party', icon: Sparkles, color: '#f59e0b',
    sub: ['Gadget Fine Festa', 'Palloncini', 'Striscioni', 'Sacchetti', 'Segnaposto'],
  },
  {
    id: 'textiles', label: 'Tessili & Arredo', icon: Package, color: '#7c3aed',
    sub: ['Cuscini Decorativi', 'Coperte', 'Asciugamani', 'Tovaglie', 'Tele Canvas'],
  },
  {
    id: 'apparel', label: 'Abbigliamento', icon: ShoppingBag, color: '#16a34a',
    sub: ['T-Shirt', 'Felpe', 'Grembiuli', 'Body Bimbo', 'Cappelli'],
  },
  {
    id: 'promotional', label: 'Promozionale', icon: Megaphone, color: '#1d4ed8',
    sub: ['Penne & Matite', 'Borse Shopper', 'Portachiavi', 'Calendari', 'Poster'],
  },
  {
    id: 'wedding', label: 'Wedding', icon: Heart, color: '#e91e63',
    sub: ['Bomboniere', 'Tableau de Mariage', 'Segnaposto Sposi', 'Inviti', 'Cornici'],
  },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const catalogRef = useRef(null);
  const closeTimerRef = useRef(null);
  const location = useLocation();
  const { totalCount } = useCart();

  const openCatalog = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setCatalogOpen(true);
  };

  const closeCatalog = () => {
    closeTimerRef.current = setTimeout(() => setCatalogOpen(false), 120);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        <div className="nav-brand">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            <div className="logo-placeholder">
              <span className="logo-text">Smart Print</span>
              <span className="logo-subtext">By Ciotta</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-menu desktop-only">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>

          {/* Catalogo mega-dropdown */}
          <div
            className={`nav-dropdown-wrap ${catalogOpen ? 'open' : ''}`}
            ref={catalogRef}
            onMouseEnter={openCatalog}
            onMouseLeave={closeCatalog}
          >
            <button className={`nav-link nav-link-dropdown ${location.pathname === '/shop' ? 'active' : ''}`}>
              Catalogo <ChevronDown size={14} className="dropdown-chevron" />
            </button>

            <div className="mega-dropdown" onMouseEnter={openCatalog} onMouseLeave={closeCatalog}>
              <div className="mega-dropdown-inner">
                {CATALOG_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.id} className="mega-col">
                      <Link
                        to={`/shop?category=${cat.id}`}
                        className="mega-cat-title"
                        onClick={() => setCatalogOpen(false)}
                      >
                        <span className="mega-cat-icon" style={{ color: cat.color }}>
                          <Icon size={18} />
                        </span>
                        {cat.label}
                      </Link>
                      <ul className="mega-sub-list">
                        {cat.sub.map(s => (
                          <li key={s}>
                            <Link
                              to={`/shop?category=${cat.id}&search=${encodeURIComponent(s)}`}
                              className="mega-sub-link"
                              onClick={() => setCatalogOpen(false)}
                            >
                              {s}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <div className="mega-footer">
                <Link to="/shop" className="mega-footer-link" onClick={() => setCatalogOpen(false)}>
                  Vedi tutto il catalogo →
                </Link>
              </div>
            </div>
          </div>

          <Link to="/reviews" className={`nav-link ${isActive('/reviews')}`}>Recensioni</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contattaci</Link>
        </nav>

        {/* Icons */}
        <div className="nav-actions">
          {searchOpen ? (
            <form className="nav-search-form" onSubmit={handleSearch}>
              <input
                autoFocus
                type="text"
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="nav-search-input"
              />
              <button type="submit" className="icon-btn" aria-label="Cerca">
                <Search size={18} />
              </button>
              <button type="button" className="icon-btn" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} aria-label="Chiudi">
                <X size={18} />
              </button>
            </form>
          ) : (
            <button className="icon-btn" aria-label="Cerca" onClick={() => setSearchOpen(true)}>
              <Search size={22} />
            </button>
          )}
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Carrello">
            <ShoppingCart size={22} />
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </Link>
          
          <button className="mobile-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <nav className="mobile-nav">
            <Link to="/" className="mobile-link" onClick={toggleMenu}>Home</Link>

            {/* Mobile catalog accordion */}
            <div className="mobile-catalog-section">
              <button
                className="mobile-link mobile-catalog-toggle"
                onClick={() => setMobileCatalogOpen(v => !v)}
              >
                Catalogo Prodotti
                <ChevronDown size={16} className={`mobile-chevron ${mobileCatalogOpen ? 'open' : ''}`} />
              </button>
              {mobileCatalogOpen && (
                <div className="mobile-catalog-grid">
                  {CATALOG_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.id}`}
                        className="mobile-cat-card"
                        onClick={toggleMenu}
                        style={{ borderColor: cat.color + '40' }}
                      >
                        <Icon size={20} style={{ color: cat.color }} />
                        <span>{cat.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link to="/reviews" className="mobile-link" onClick={toggleMenu}>Recensioni</Link>
            <Link to="/contact" className="mobile-link" onClick={toggleMenu}>Contattaci & FAQ</Link>
            <Link to="/cart" className="mobile-link" onClick={toggleMenu}>
              Carrello {totalCount > 0 && `(${totalCount})`}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
