import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

function StatusBoardPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [draftStatuses, setDraftStatuses] = useState({});

  const canUpdateExit = user?.role === 'manager' || user?.role === 'storekeeper';
  const canUpdateRepair = user?.role === 'manager' || user?.role === 'workshop';

  const fetchStatuses = () => {
    setLoading(true);
    setError('');
    apiRequest('list_statuses', { token })
      .then((data) => {
        setItems(data.items || []);
      })
      .catch((err) => {
        setError(err.message || 'بارگیری وضعیت‌ها ناموفق بود.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return items.filter((item) => {
      const haystack = `${item.no} ${item.status || ''}`;
      return haystack.includes(filter.trim());
    });
  }, [items, filter]);

  const grouped = useMemo(() => {
    const result = { exit: [], repair: [] };
    filteredItems.forEach((item) => {
      result[item.type]?.push(item);
    });
    return result;
  }, [filteredItems]);

  const handleDraftChange = (key, value) => {
    setDraftStatuses((prev) => ({ ...prev, [key]: value }));
  };

  const handleStatusUpdate = async (event, entity, no) => {
    event.preventDefault();
    const key = `${entity}-${no}`;
    const newStatus = draftStatuses[key];
    if (!newStatus) {
      setError('لطفاً وضعیت جدید را وارد کنید.');
      return;
    }
    try {
      setError('');
      await apiRequest('update_status', {
        method: 'POST',
        token,
        data: { entity, no, status: newStatus },
      });
      setMessage('وضعیت با موفقیت به‌روزرسانی شد.');
      setItems((prev) =>
        prev.map((item) =>
          item.type === entity && item.no === no
            ? { ...item, status: newStatus }
            : item
        )
      );
      handleDraftChange(key, '');
    } catch (err) {
      setMessage('');
      setError(err.message || 'به‌روزرسانی وضعیت ناموفق بود.');
    }
  };

  const renderColumn = (entity, title, canUpdate) => {
    const list = grouped[entity];
    return (
      <section className="panel">
        <header className="panel__header">
          <h3>{title}</h3>
          <span className="panel__subtitle">{list.length} مورد</span>
        </header>
        <div className="status-column">
          {list.length === 0 && <p className="data-table__empty">موردی یافت نشد.</p>}
          {list.map((item) => {
            const key = `${entity}-${item.no}`;
            return (
              <article key={key} className="status-card">
                <header className="status-card__header">
                  <div>
                    <h4>{`${item.no}`}</h4>
                    <span>{item.date || 'تاریخ نامشخص'}</span>
                  </div>
                  <span className="status-card__badge">{item.status || 'نامعلوم'}</span>
                </header>
                {canUpdate ? (
                  <form
                    className="status-card__form"
                    onSubmit={(event) => handleStatusUpdate(event, entity, item.no)}
                  >
                    <label>
                      <span>وضعیت جدید</span>
                      <input
                        type="text"
                        value={draftStatuses[key] ?? ''}
                        onChange={(event) => handleDraftChange(key, event.target.value)}
                        placeholder="مثال: تحویل شد"
                        required
                      />
                    </label>
                    <div className="status-card__actions">
                      <button type="submit" className="btn btn--primary btn--small">
                        ذخیره
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="status-card__hint">حق ویرایش وضعیت برای نقش شما فعال نیست.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>تابلوی وضعیت</h2>
        <p>وضعیت لحظه‌ای فرم‌های خروج و تعمیر را دنبال کنید.</p>
      </div>

      <div className="panel panel--toolbar">
        <div className="toolbar">
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="جستجو بر اساس شماره فرم یا وضعیت"
          />
          <button type="button" className="btn btn--secondary" onClick={fetchStatuses}>
            بروزرسانی
          </button>
        </div>
      </div>

      {loading && <div className="panel">در حال بارگذاری...</div>}
      {error && <div className="panel panel--error">{error}</div>}
      {message && <div className="panel panel--success">{message}</div>}

      {!loading && !error && (
        <div className="board-grid">
          {renderColumn('exit', 'فرم‌های خروج', canUpdateExit)}
          {renderColumn('repair', 'فرم‌های تعمیر', canUpdateRepair)}
        </div>
      )}
    </div>
  );
}

export default StatusBoardPage;
