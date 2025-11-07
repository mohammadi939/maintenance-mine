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

function ExitFormPage() {
  const { token, user } = useAuth();
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    form_no: '',
    date_shamsi: '',
    out_type: '',
    driver_name: '',
    reason: '',
    unit_id: user?.unit_id || '',
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
    setMessage('');
    setError('');
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: field === 'quantity' ? Number(value) : value };
      return clone;
    });
  };

  const addItem = () => {
    if (items.length >= 5) return;
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setForm({
      form_no: '',
      date_shamsi: '',
      out_type: '',
      driver_name: '',
      reason: '',
      unit_id: user?.unit_id || '',
    });
    setItems([createEmptyItem()]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...form,
        unit_id: Number(form.unit_id),
        items: items.map((item) => ({
          description: item.description,
          code: item.code || undefined,
          quantity: Number(item.quantity),
          unit: item.unit,
          equipment_id: item.equipment_id || undefined,
        })),
      };
      const response = await apiRequest('create_exit_form', {
        method: 'POST',
        token,
        data: payload,
      });
      setMessage(`فرم با موفقیت ثبت شد. شماره رکورد: ${response.id}`);
      resetForm();
    } catch (err) {
      setError(err.message || 'ثبت فرم ناموفق بود.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>ثبت فرم خروج دستگاه / کالا</h2>
        <p>جهت ارسال دستگاه یا قطعه به خارج از معدن، اطلاعات فرم را تکمیل کنید.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>اطلاعات عمومی</h3>
          <div className="form-grid">
            <label className="form-field">
              <span>شماره فرم</span>
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
                placeholder="مثال: 1403/01/15"
                value={form.date_shamsi}
                onChange={handleChange}
                required
              />
            </label>
            <label className="form-field">
              <span>نوع خروج</span>
              <input
                type="text"
                name="out_type"
                value={form.out_type}
                onChange={handleChange}
                placeholder="مانند: ارسال به تعمیرگاه"
              />
            </label>
            <label className="form-field">
              <span>راننده / حمل‌کننده</span>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
              />
            </label>
            <label className="form-field form-field--wide">
              <span>دلیل خروج</span>
              <textarea
                name="reason"
                rows="2"
                value={form.reason}
                onChange={handleChange}
                placeholder="شرح خرابی یا علت ارسال"
              />
            </label>
            <label className="form-field">
              <span>واحد درخواست‌کننده</span>
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
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h3>اقلام همراه</h3>
            <button type="button" className="btn btn--secondary" onClick={addItem} disabled={items.length >= 5}>
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
                        required
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
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(event) => handleItemChange(index, 'unit', event.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.equipment_id}
                        onChange={(event) => handleItemChange(index, 'equipment_id', event.target.value)}
                        placeholder="اختیاری"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="form-success">{message}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'در حال ثبت...' : 'ثبت فرم'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetForm} disabled={submitting}>
            پاکسازی فرم
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExitFormPage;
