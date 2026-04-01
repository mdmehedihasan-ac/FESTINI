import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Filter, Loader, Gift, ShoppingBag, Sparkles, Package, Megaphone, Heart, LayoutGrid } from 'lucide-react';
import { categoryIconMap, categoryColorMap, ProductPlaceholder } from '../utils/productHelpers';
import './Shop.css';

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryQuery = params.get('category');
    const searchParam = params.get('search');
    if (categoryQuery) setActiveCategory(categoryQuery);
    if (searchParam) setSearchQuery(searchParam);
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeCategory !== 'all') params.set('category', activeCategory);
        if (sortOrder) params.set('sort', sortOrder);
        if (searchQuery) params.set('search', searchQuery);
        const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`;

        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategory, sortOrder, searchQuery]);

  const categories = [
    { id: 'all',         name: 'Tutti',         icon: LayoutGrid },
    { id: 'gifts',       name: 'RegaliAMO',     icon: Gift        },
    { id: 'party',       name: 'Party',         icon: Sparkles    },
    { id: 'textiles',    name: 'Tessili',       icon: Package     },
    { id: 'apparel',     name: 'Abbigliamento', icon: ShoppingBag },
    { id: 'promotional', name: 'Promozionale',  icon: Megaphone   },
    { id: 'wedding',     name: 'Wedding',       icon: Heart       },
  ];

  return (
    <div className="shop-page animate-fade-in">
      <div className="shop-header">
        <div className="container">
          <h1 className="shop-title">Il Nostro Catalogo</h1>
          <p className="shop-subtitle">Scopri la nostra selezione di prodotti da personalizzare</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="container">
        <div className="section-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`section-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <div className="section-tab-icon">
                <cat.icon size={22} />
              </div>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container shop-container">
        {/* Sidebar Filters */}
        <aside className="shop-sidebar">
          <div className="filter-widget">
            <h3 className="widget-title">
              <Filter size={18} /> Categoria
            </h3>
            <ul className="category-list">
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <cat.icon size={15} style={{flexShrink: 0}} />
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="filter-widget promo-widget mt-4">
            <div className="promo-content">
              <h4>San Valentino</h4>
              <p>Scopri le idee regalo per la tua dolce metà.</p>
              <button 
                className="btn btn-outline" 
                style={{width: '100%', marginTop: '1rem', padding: '0.5rem'}}
                onClick={() => setActiveCategory('gifts')}
              >
                Vedi Regali
              </button>
            </div>
          </div>
        </aside>

        {/* Product Listing */}
        <div className="shop-content">
          <div className="shop-controls mb-4">
            <span>Trovati {products.length} prodotti</span>
            <div className="sort-dropdown">
              <select className="sort-btn" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="">Ordina per...</option>
                <option value="price_asc">Prezzo: dal più basso</option>
                <option value="price_desc">Prezzo: dal più alto</option>
                <option value="name_asc">Nome A→Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
              <Loader className="animate-spin" size={40} color="var(--primary)" />
            </div>
          ) : (
            <div className="product-grid shop-grid">
              {products.map(product => (
                <div key={product.id} className="product-card animate-fade-in">
                  <div className="product-image-container">
                    {product.isSpecialOffer && <span className="badge-offer">Promo</span>}
                    <ProductPlaceholder category={product.category} />
                    {product.image && (
                      <img src={product.image} alt={product.name} className="product-img" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    )}
                    <div className="product-overlay">
                      <Link to={`/product/${product.id}`} className="btn btn-primary">Personalizza</Link>
                    </div>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{product.subcategory || product.category}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">€{product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p>Nessun prodotto trovato in questa categoria.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
