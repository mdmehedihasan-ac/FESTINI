import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login fallito');
      login(data.token, data.email);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <Lock size={32} color="var(--primary)" />
        </div>
        <h1>Pannello Admin</h1>
        <p className="admin-login-sub">FESTINI — Smart Print Ciotta</p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="text-input"
              placeholder="admin@festini.it"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="text-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary admin-login-btn" disabled={loading}>
            {loading ? <Loader className="animate-spin" size={18} /> : 'Accedi'}
          </button>
        </form>

        <p className="admin-login-hint">
          {import.meta.env.DEV && 'Dev: admin@festini.it / admin1234'}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
