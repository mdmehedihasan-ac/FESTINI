import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [qty, setQty] = useState(1);
  const [personalization, setPersonalization] = useState({});
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product?id=${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Loader className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container text-center" style={{ padding: '8rem 0' }}>
        <h2>Prodotto non trovato</h2>
        <Link to="/shop" className="btn btn-primary mt-4">Torna al Catalogo</Link>
      </div>
    );
  }

  const handlePersonalizeChange = (option, value) => {
    setPersonalization(prev => ({ ...prev, [option]: value }));
  };

  const handleAddToCart = () => {
    addItem(product, qty, personalization);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-detail-page animate-fade-in">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link> / 
          <Link to="/shop">Shop</Link> / 
          <Link to={`/shop?category=${product.category.split(' ')[0]}`}>{product.category}</Link> / 
          <span>{product.name}</span>
        </div>

        <div className="product-detail-container">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image-wrapper">
              {product.isSpecialOffer && <span className="badge-offer-large">Novità</span>}
              <img src={product.image} alt={product.name} className="main-image" />
            </div>
            <div className="thumbnails">
              {[product.image, product.image, product.image].map((img, i) => (
                <div key={i} className={`thumb-wrap ${i===0 ? 'active' : ''}`}>
                  <img src={img} alt="thumbnail" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="product-actions">
            <span className="p-category">{product.category}</span>
            <h1 className="p-title">{product.name}</h1>
            <p className="p-price">€{product.price.toFixed(2)}</p>
            
            <p className="p-desc">{product.description}</p>

            {/* Personalization Options */}
            {product.personalizeOptions && product.personalizeOptions.length > 0 && (
              <div className="personalization-section">
                <h3>Personalizza il tuo prodotto</h3>
                {product.personalizeOptions.map((opt, i) => (
                  <div key={i} className="form-group">
                    <label>{opt}</label>
                    {opt.toLowerCase().includes('foto') || opt.toLowerCase().includes('grafica') ? (
                      <input type="file" className="file-input" onChange={(e) => handlePersonalizeChange(opt, e.target.files[0]?.name)} />
                    ) : opt.toLowerCase().includes('colore') ? (
                      <select className="select-input" onChange={(e) => handlePersonalizeChange(opt, e.target.value)}>
                        <option value="">Seleziona...</option>
                        <option value="Rosso">Rosso</option>
                        <option value="Blu">Blu</option>
                        <option value="Verde">Verde</option>
                        <option value="Nero">Nero</option>
                      </select>
                    ) : (
                      <input type="text" className="text-input" placeholder={`Inserisci ${opt}`} onChange={(e) => handlePersonalizeChange(opt, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="cart-actions mt-6">
              <div className="qty-selector">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <input type="number" value={qty} readOnly />
                <button onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button 
                className={`btn ${added ? 'btn-success' : 'btn-primary'} add-to-cart-btn`}
                style={{ background: added ? '#2e7d32' : '' }}
                onClick={handleAddToCart}
              >
                {added ? 'Aggiunto!' : <><ShoppingCart size={20} /> Aggiungi al Carrello</>}
              </button>
              <button className="btn btn-outline wishlist-btn">
                <Heart size={20} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges mt-6">
              <div className="badge-item">
                <Truck size={24} color="var(--primary)" />
                <div className="badge-text">
                  <strong>Spedizione Rapida</strong>
                  <span>Standard o Express in Italia</span>
                </div>
              </div>
              <div className="badge-item">
                <ShieldCheck size={24} color="var(--primary)" />
                <div className="badge-text">
                  <strong>Pagamenti Sicuri</strong>
                  <span>Carte di Credito o PayPal</span>
                </div>
              </div>
              <div className="badge-item">
                <RotateCcw size={24} color="var(--primary)" />
                <div className="badge-text">
                  <strong>Qualità Garantita</strong>
                  <span>Materiali Premium certificati</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
