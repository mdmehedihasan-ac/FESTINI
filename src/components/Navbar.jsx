import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { totalCount } = useCart();

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
          <Link to="/">
            <div className="logo-placeholder">
              <span className="logo-text">Smart Print</span>
              <span className="logo-subtext">By Ciotta</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-menu desktop-only">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
          <Link to="/shop" className={`nav-link ${isActive('/shop')}`}>Catalogo</Link>
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
            <Link to="/shop" className="mobile-link" onClick={toggleMenu}>Catalogo Prodotti</Link>
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
