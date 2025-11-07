import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'cmms_inventory_watch';

function InventoryPage() {
  const { token } = useAuth();
  const [watchList, setWatchList] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse watch list', error);
      return [];
    }
  });
  const [form, setForm] = useState({ name: '', min: 1, stock: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchList));
  }, [watchList]);

  const handleAddWatch = (event) => {
    event.preventDefault();
    if (!form.name) return;
    const exists = watchList.some((item) => item.name === form.name.trim());
    if (exists) {
      setError('این قطعه قبلاً به لیست افزوده شده است.');
      return;
    }
    setWatchList((prev) => [
      ...prev,
      {
        name: form.name.trim(),
        min: Number(form.min) || 0,
        stock: Number(form.stock) || 0,
      },
    ]);
    setForm({ name: '', min: 1, stock: 0 });
    setError('');
  };

  const updateItem = (name, changes) => {
    setWatchList((prev) => prev.map((item) => (item.name === name ? { ...item, ...changes } : item)));
  };

  const removeItem = (name) => {
    setWatchList((prev) => prev.filter((item) => item.name !== name));
  };

  const statusSummary = useMemo(() => {
    const total = watchList.length;
    const low = watchList.filter((item) => item.stock <= item.min).length;
    return { total, low };
  }, [watchList]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const data = await apiRequest('search_forms', {
        token,
        params: { q: searchTerm.trim() },
      });
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message || 'جستجو ناموفق بود.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>مدیریت موجودی قطعات</h2>
        <p>سطح موجودی قطعات پرمصرف را پایش و هشدار کمبود را مدیریت کنید.</p>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <header>تعداد اقلام تحت پایش</header>
          <div className="stat-card__value">{statusSummary.total}</div>
          <p className="stat-card__hint">اقلامی که در لیست کنترل موجودی قرار دارند.</p>
        </article>
        <article className="stat-card">
          <header>هشدار کمبود</header>
          <div className="stat-card__value stat-card__value--alert">{statusSummary.low}</div>
          <p className="stat-card__hint">اقلامی که موجودی فعلی آن‌ها کمتر یا برابر حداقل تعریف شده است.</p>
        </article>
      </section>

      <section className="panel">
        <header className="panel__header">
          <h3>افزودن قطعه جدید</h3>
          <span className="panel__subtitle">حداقل موجودی و موجودی فعلی را مشخص کنید.</span>
        </header>
        <form className="form-inline" onSubmit={handleAddWatch}>
          <label>
            <span>عنوان قطعه</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>حداقل موجودی</span>
            <input
              type="number"
              min="0"
              value={form.min}
              onChange={(event) => setForm((prev) => ({ ...prev, min: Number(event.target.value) }))}
            />
          </label>
          <label>
            <span>موجودی فعلی</span>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
            />
          </label>
          <button type="submit" className="btn btn--primary">
            افزودن به لیست
          </button>
        </form>
        {error && <div className="form-error" role="alert">{error}</div>}
      </section>

      <section className="panel">
        <header className="panel__header">
          <h3>لیست موجودی</h3>
        </header>
        <div className="inventory-table table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>نام قطعه</th>
                <th>حداقل موجودی</th>
                <th>موجودی فعلی</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {watchList.length === 0 && (
                <tr>
                  <td colSpan="5" className="data-table__empty">
                    هنوز قطعه‌ای برای پایش ثبت نشده است.
                  </td>
                </tr>
              )}
              {watchList.map((item) => {
                const isLow = item.stock <= item.min;
                return (
                  <tr key={item.name} className={isLow ? 'row-alert' : undefined}>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.min}
                        onChange={(event) => updateItem(item.name, { min: Number(event.target.value) })}
                      />
                    </td>
                    <td>
                      <div className="inventory-stock-control">
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => updateItem(item.name, { stock: Math.max(0, item.stock - 1) })}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.stock}
                          onChange={(event) => updateItem(item.name, { stock: Number(event.target.value) })}
                        />
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          onClick={() => updateItem(item.name, { stock: item.stock + 1 })}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{isLow ? 'نیاز به تأمین' : 'موجودی مناسب'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => removeItem(item.name)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <header className="panel__header">
          <h3>رهگیری فرم‌ها</h3>
          <span className="panel__subtitle">بر اساس شماره فرم یا کلمات کلیدی جستجو کنید.</span>
        </header>
        <form className="form-inline" onSubmit={handleSearch}>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="شماره فرم یا عبارت جستجو"
          />
          <button type="submit" className="btn btn--secondary" disabled={searching}>
            {searching ? 'در حال جستجو...' : 'جستجو'}
          </button>
        </form>
        <div className="search-results">
          {searchResults.length === 0 && !searching && <p>نتیجه‌ای برای نمایش وجود ندارد.</p>}
          {searchResults.length > 0 && (
            <ul>
              {searchResults.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <span className="search-results__type">{result.type === 'exit' ? 'خروج' : 'تعمیر'}</span>
                  <span>{result.no}</span>
                  <span>{result.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default InventoryPage;
