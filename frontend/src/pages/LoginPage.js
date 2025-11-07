import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { login, token, loading, error, setError } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.username || !form.password) {
      setError('نام کاربری و رمز عبور الزامی است.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      // Error already handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <h1>سیستم مدیریت تعمیرات معدن</h1>
          <p>لطفاً برای ورود، اطلاعات حساب کاربری خود را وارد کنید.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>نام کاربری</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              disabled={loading || submitting}
              required
            />
          </label>
          <label className="form-field">
            <span>رمز عبور</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              disabled={loading || submitting}
              required
            />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button type="submit" className="btn btn--primary" disabled={loading || submitting}>
            {submitting || loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
