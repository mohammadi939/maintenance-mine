import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

function groupByStatus(items) {
  return items.reduce((acc, item) => {
    const key = item.status || 'نامعلوم';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function DashboardPage() {
  const { token } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [recent, setRecent] = useState({ exit: [], repair: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest('list_statuses', { token }),
      apiRequest('recent_forms', { token, params: { limit: 10 } }),
    ])
      .then(([statusRes, recentRes]) => {
        if (!active) return;
        setStatuses(statusRes.items || []);
        setRecent({ exit: recentRes.exit || [], repair: recentRes.repair || [] });
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'دریافت داده‌ها ناموفق بود.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const exitStatuses = useMemo(
    () => statuses.filter((item) => item.type === 'exit'),
    [statuses]
  );
  const repairStatuses = useMemo(
    () => statuses.filter((item) => item.type === 'repair'),
    [statuses]
  );

  const statusSummary = useMemo(() => {
    return {
      exit: groupByStatus(exitStatuses),
      repair: groupByStatus(repairStatuses),
    };
  }, [exitStatuses, repairStatuses]);

  const recentActivity = useMemo(() => {
    const exitActivity = (recent.exit || []).map((item) => ({
      ...item,
      typeLabel: 'خروج',
      typeEmoji: '🚚',
    }));
    const repairActivity = (recent.repair || []).map((item) => ({
      ...item,
      typeLabel: 'تعمیر',
      typeEmoji: '🛠️',
    }));
    return [...exitActivity, ...repairActivity]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 8);
  }, [recent]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>داشبورد</h2>
        <p>نمای کلی از آخرین وضعیت فرم‌ها و فعالیت‌های سیستم.</p>
      </div>

      {loading && <div className="panel">در حال بارگذاری داده‌ها...</div>}
      {error && <div className="panel panel--error">{error}</div>}

      {!loading && !error && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <header>فرم‌های خروج</header>
              <div className="stat-card__value">{exitStatuses.length}</div>
              <ul className="stat-card__list">
                {Object.entries(statusSummary.exit).map(([status, count]) => (
                  <li key={status}>
                    <span>{status}</span>
                    <span>{count}</span>
                  </li>
                ))}
                {exitStatuses.length === 0 && <li>موردی ثبت نشده است.</li>}
              </ul>
            </article>
            <article className="stat-card">
              <header>فرم‌های تعمیر</header>
              <div className="stat-card__value">{repairStatuses.length}</div>
              <ul className="stat-card__list">
                {Object.entries(statusSummary.repair).map(([status, count]) => (
                  <li key={status}>
                    <span>{status}</span>
                    <span>{count}</span>
                  </li>
                ))}
                {repairStatuses.length === 0 && <li>موردی ثبت نشده است.</li>}
              </ul>
            </article>
            <article className="stat-card">
              <header>کل فرم‌ها</header>
              <div className="stat-card__value">
                {exitStatuses.length + repairStatuses.length}
              </div>
              <p className="stat-card__hint">
                مجموع درخواست‌های جاری در چرخه تعمیرات.
              </p>
            </article>
          </section>

          <section className="panel">
            <header className="panel__header">
              <h3>آخرین فعالیت‌ها</h3>
              <span className="panel__subtitle">جدیدترین فرم‌های ثبت‌شده</span>
            </header>
            <div className="activity-list">
              {recentActivity.length === 0 && <p>هنوز فعالیتی ثبت نشده است.</p>}
              {recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="activity-item">
                  <div className="activity-item__icon" aria-hidden>
                    {item.typeEmoji}
                  </div>
                  <div className="activity-item__body">
                    <div className="activity-item__title">
                      {item.typeLabel} #{item.form_no || item.no}
                    </div>
                    <div className="activity-item__meta">
                      <span>{item.date_shamsi || item.date || 'تاریخ ثبت نشده'}</span>
                      {item.status && <span>وضعیت: {item.status}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
