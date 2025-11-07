import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const createEmptyItem = () => ({
  description: '',
  code: '',
  quantity: 1,
  unit: '',
  equipment_id: '',
});

function RepairFormPage() {
  const { token, user } = useAuth();
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    form_no: '',
    unit_id: user?.unit_id || '',
    date_shamsi: '',
    description: '',
    reference_exit_form_no: '',
  });
  const [items, setItems] = useState([createEmptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('list_units', { token })
      .then((data) => {
        if (!active) return;
        setUnits(data.units || []);
      })
      .catch(() => {
        if (active) {
          setError('دریافت لیست واحدها ناموفق بود.');
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (user?.unit_id) {
      setForm((prev) => ({ ...prev, unit_id: user.unit_id }));
    }
  }, [user]);

  const unitOptions = useMemo(() => units.map((u) => ({ value: u.id, label: u.name })), [units]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setMessage('');
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: field === 'quantity' ? Number(value) : value };
      return clone;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setForm({
      form_no: '',
      unit_id: user?.unit_id || '',
      date_shamsi: '',
      description: '',
      reference_exit_form_no: '',
    });
    setItems([createEmptyItem()]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        unit_id: Number(form.unit_id),
        items: items
          .filter((item) => item.description || item.unit)
          .map((item) => ({
            description: item.description,
            code: item.code || undefined,
            quantity: Number(item.quantity),
            unit: item.unit,
            equipment_id: item.equipment_id || undefined,
          })),
      };
      const response = await apiRequest('create_repair_form', {
        method: 'POST',
        token,
        data: payload,
      });
      setMessage(`فرم تعمیر با موفقیت ثبت شد. شماره رکورد: ${response.id}`);
      resetForm();
    } catch (err) {
      setError(err.message || 'ثبت فرم تعمیر ناموفق بود.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>ثبت درخواست تعمیرات</h2>
        <p>جزئیات خرابی و سوابق مرتبط با خروج تجهیز را ثبت کنید.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>اطلاعات فرم</h3>
          <div className="form-grid">
            <label className="form-field">
              <span>شماره فرم تعمیر</span>
              <input
                type="text"
                name="form_no"
                value={form.form_no}
                onChange={handleChange}
                required
              />
            </label>
            <label className="form-field">
              <span>تاریخ (شمسی)</span>
              <input
                type="text"
                name="date_shamsi"
                value={form.date_shamsi}
                onChange={handleChange}
                placeholder="مثال: 1403/01/20"
                required
              />
            </label>
            <label className="form-field">
              <span>واحد متقاضی</span>
              <select
                name="unit_id"
                value={form.unit_id}
                onChange={handleChange}
                disabled={user?.role === 'unit'}
                required
              >
                <option value="">انتخاب واحد</option>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>ارجاع به فرم خروج</span>
              <input
                type="text"
                name="reference_exit_form_no"
                value={form.reference_exit_form_no}
                onChange={handleChange}
                placeholder="در صورت وجود"
              />
            </label>
            <label className="form-field form-field--wide">
              <span>شرح خرابی</span>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder="شرح کامل خرابی، علائم و اقدامات اولیه"
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h3>اقلام و قطعات مورد نیاز</h3>
            <button type="button" className="btn btn--secondary" onClick={addItem}>
              افزودن ردیف
            </button>
          </header>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>شرح</th>
                  <th>کد</th>
                  <th>تعداد</th>
                  <th>واحد</th>
                  <th>کد تجهیز</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) => handleItemChange(index, 'description', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.code}
                        onChange={(event) => handleItemChange(index, 'code', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) => handleItemChange(index, 'quantity', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(event) => handleItemChange(index, 'unit', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.equipment_id}
                        onChange={(event) => handleItemChange(index, 'equipment_id', event.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => removeItem(index)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="data-table__empty">
                      برای افزودن قطعه جدید، روی «افزودن ردیف» کلیک کنید.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="form-success">{message}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'در حال ثبت...' : 'ثبت درخواست'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetForm} disabled={submitting}>
            پاکسازی فرم
          </button>
        </div>
      </form>
    </div>
  );
}

export default RepairFormPage;
