import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, MessageSquare, Plus, Trash2, Edit3, X, Check, Loader, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const TABS = ['Prodotti', 'Ordini', 'Messaggi'];

const AdminDashboard = () => {
  const { token, adminEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Prodotti');

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // ── Products ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', category: '', image: '', description: '', is_special_offer: false, personalize_options: '' });
  const [productSaving, setProductSaving] = useState(false);

  // ── Orders ───────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Contacts ─────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    if (!token) navigate('/admin');
  }, [token, navigate]);

  useEffect(() => {
    if (activeTab === 'Prodotti') fetchProducts();
    else if (activeTab === 'Ordini') fetchOrders();
    else if (activeTab === 'Messaggi') fetchContacts();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Products
  async function fetchProducts() {
    setProductsLoading(true);
    setGlobalError('');
    try {
      const res = await fetch('/api/admin-products', { headers: authHeaders });
      if (res.status === 401) { logout(); navigate('/admin'); return; }
      const data = await res.json();
      setProducts(data);
    } catch {
      setGlobalError('Errore nel caricamento dei prodotti');
    } finally {
      setProductsLoading(false);
    }
  }

  function openNewProductForm() {
    setEditProduct(null);
    setProductForm({ name: '', price: '', category: 'gifts', image: '', description: '', is_special_offer: false, personalize_options: '' });
    setShowProductForm(true);
  }

  function openEditProductForm(product) {
    setEditProduct(product);
    setProductForm({
      name: product.name || '',
      price: product.price || '',
      category: product.category || 'gifts',
      image: product.image || '',
      description: product.description || '',
      is_special_offer: product.is_special_offer || false,
      personalize_options: Array.isArray(product.personalize_options)
        ? product.personalize_options.join(', ')
        : (product.personalize_options || ''),
    });
    setShowProductForm(true);
  }

  async function saveProduct(e) {
    e.preventDefault();
    setProductSaving(true);
    const body = {
      ...productForm,
      price: parseFloat(productForm.price) || 0,
      personalize_options: productForm.personalize_options.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      const url = editProduct ? `/api/admin-products?id=${editProduct.id}` : '/api/admin-products';
      const method = editProduct ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowProductForm(false);
      fetchProducts();
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setProductSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Eliminare questo prodotto?')) return;
    try {
      const res = await fetch(`/api/admin-products?id=${id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      fetchProducts();
    } catch (err) {
      setGlobalError(err.message);
    }
  }

  // Orders
  async function fetchOrders() {
    setOrdersLoading(true);
    setGlobalError('');
    try {
      const res = await fetch('/api/admin-orders', { headers: authHeaders });
      if (res.status === 401) { logout(); navigate('/admin'); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setGlobalError('Errore nel caricamento degli ordini');
    } finally {
      setOrdersLoading(false);
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      const res = await fetch(`/api/admin-orders?id=${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      fetchOrders();
    } catch (err) {
      setGlobalError(err.message);
    }
  }

  // Contacts
  async function fetchContacts() {
    setContactsLoading(true);
    setGlobalError('');
    try {
      const res = await fetch('/api/admin-contacts', { headers: authHeaders });
      if (res.status === 401) { logout(); navigate('/admin'); return; }
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setGlobalError('Errore nel caricamento dei messaggi');
    } finally {
      setContactsLoading(false);
    }
  }

  const statusColors = {
    pending: '#ff9800',
    paid: '#4caf50',
    processing: '#2196f3',
    shipped: '#9c27b0',
    delivered: '#4caf50',
    cancelled: '#f44336',
  };

  return (
    <div className="admin-dashboard">
      {/* Top bar */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-logo-text">Smart Print</span>
          <span className="admin-logo-sub">Admin</span>
        </div>
        <div className="admin-topbar-right">
          <span className="admin-email">{adminEmail}</span>
          <button className="btn-icon" onClick={() => { logout(); navigate('/admin'); }} aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Sidebar */}
        <nav className="admin-sidebar">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`admin-nav-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Prodotti' && <Package size={18} />}
              {tab === 'Ordini' && <ShoppingBag size={18} />}
              {tab === 'Messaggi' && <MessageSquare size={18} />}
              {tab}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="admin-main">
          {globalError && (
            <div className="admin-global-error">
              {globalError}
              <button onClick={() => setGlobalError('')}><X size={16} /></button>
            </div>
          )}

          {/* ── PRODOTTI ── */}
          {activeTab === 'Prodotti' && (
            <div>
              <div className="admin-section-header">
                <h2>Prodotti</h2>
                <button className="btn btn-primary admin-add-btn" onClick={openNewProductForm}>
                  <Plus size={16} /> Nuovo Prodotto
                </button>
              </div>

              {showProductForm && (
                <div className="admin-form-card">
                  <div className="admin-form-title">
                    <h3>{editProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
                    <button onClick={() => setShowProductForm(false)}><X size={18} /></button>
                  </div>
                  <form onSubmit={saveProduct} className="admin-product-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nome *</label>
                        <input className="text-input" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Prezzo (€) *</label>
                        <input className="text-input" type="number" min="0" step="0.01" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Categoria *</label>
                        <select className="select-input" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                          <option value="gifts">Idee Regalo</option>
                          <option value="apparel">Abbigliamento</option>
                          <option value="textiles">Tessuti</option>
                          <option value="party">Feste & Party</option>
                          <option value="promotional">Promozionale</option>
                        </select>
                      </div>
                      <div className="form-group admin-checkbox-group">
                        <label>
                          <input type="checkbox" checked={productForm.is_special_offer} onChange={e => setProductForm({ ...productForm, is_special_offer: e.target.checked })} />
                          Offerta Speciale
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>URL Immagine</label>
                      <input className="text-input" type="url" placeholder="https://..." value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Descrizione</label>
                      <textarea className="text-input" rows="3" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Opzioni personalizzazione <small>(separate da virgola)</small></label>
                      <input className="text-input" placeholder="Testo, Colore, Carica Foto" value={productForm.personalize_options} onChange={e => setProductForm({ ...productForm, personalize_options: e.target.value })} />
                    </div>
                    <div className="admin-form-actions">
                      <button type="button" className="btn btn-outline" onClick={() => setShowProductForm(false)}>Annulla</button>
                      <button type="submit" className="btn btn-primary" disabled={productSaving}>
                        {productSaving ? <Loader className="animate-spin" size={16} /> : <><Check size={16} /> Salva</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {productsLoading ? (
                <div className="admin-loading"><Loader className="animate-spin" size={32} color="var(--primary)" /></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Immagine</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Prezzo</th>
                        <th>Promo</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            {p.image && <img src={p.image} alt={p.name} className="admin-product-thumb" />}
                          </td>
                          <td className="admin-product-name">{p.name}</td>
                          <td><span className="category-chip">{p.category}</span></td>
                          <td><strong>€{parseFloat(p.price).toFixed(2)}</strong></td>
                          <td>{p.is_special_offer ? '✓' : '—'}</td>
                          <td className="admin-actions-cell">
                            <button className="btn-icon" onClick={() => openEditProductForm(p)} aria-label="Modifica"><Edit3 size={16} /></button>
                            <button className="btn-icon btn-icon-danger" onClick={() => deleteProduct(p.id)} aria-label="Elimina"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan="6" className="admin-empty">Nessun prodotto</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ORDINI ── */}
          {activeTab === 'Ordini' && (
            <div>
              <div className="admin-section-header">
                <h2>Ordini</h2>
                <button className="btn btn-outline" onClick={fetchOrders}>Aggiorna</button>
              </div>

              {ordersLoading ? (
                <div className="admin-loading"><Loader className="animate-spin" size={32} color="var(--primary)" /></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>N. Ordine</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Totale</th>
                        <th>Pagamento</th>
                        <th>Stato</th>
                        <th>Data</th>
                        <th>Aggiorna</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td><code className="order-num">{o.order_number}</code></td>
                          <td>{o.customer_name || '—'}</td>
                          <td>{o.customer_email}</td>
                          <td><strong>€{parseFloat(o.total_amount).toFixed(2)}</strong></td>
                          <td><span className={`payment-chip ${o.payment_method}`}>{o.payment_method}</span></td>
                          <td>
                            <span className="status-chip" style={{ background: statusColors[o.status] + '22', color: statusColors[o.status] }}>
                              {o.status}
                            </span>
                          </td>
                          <td>{new Date(o.created_at).toLocaleDateString('it-IT')}</td>
                          <td>
                            <select
                              className="status-select"
                              value={o.status}
                              onChange={e => updateOrderStatus(o.id, e.target.value)}
                            >
                              {['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan="8" className="admin-empty">Nessun ordine ancora. Configura DATABASE_URL per salvare gli ordini.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGGI ── */}
          {activeTab === 'Messaggi' && (
            <div>
              <div className="admin-section-header">
                <h2>Messaggi di Contatto</h2>
                <button className="btn btn-outline" onClick={fetchContacts}>Aggiorna</button>
              </div>

              {contactsLoading ? (
                <div className="admin-loading"><Loader className="animate-spin" size={32} color="var(--primary)" /></div>
              ) : (
                <div className="contacts-list">
                  {contacts.map(c => (
                    <div key={c.id} className="contact-card-admin">
                      <div className="contact-card-header">
                        <div>
                          <strong>{c.name}</strong>
                          <span> — {c.email}</span>
                        </div>
                        <div className="contact-meta">
                          <span className="contact-subject">{c.subject || 'Informazioni Generali'}</span>
                          <span className="contact-date">{new Date(c.created_at).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                      <p className="contact-message">{c.message}</p>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="admin-empty-block">Nessun messaggio ancora. Configura DATABASE_URL per salvare i messaggi.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
