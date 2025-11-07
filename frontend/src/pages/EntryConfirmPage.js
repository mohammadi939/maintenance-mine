import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const createEmptyItem = () => ({
  description: '',
  code: '',
  quantity: 1,
  unit: '',
});

function EntryConfirmPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    confirm_no: '',
    purchase_date_shamsi: '',
    purchase_center: '',
    purchase_request_code: '',
    buyer_name: '',
    driver_name: '',
    reference_exit_form_no: '',
    reference_repair_form_no: '',
  });
  const [items, setItems] = useState([createEmptyItem(), createEmptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    if (items.length >= 11) return;
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setForm({
      confirm_no: '',
      purchase_date_shamsi: '',
      purchase_center: '',
      purchase_request_code: '',
      buyer_name: '',
      driver_name: '',
      reference_exit_form_no: '',
      reference_repair_form_no: '',
    });
    setItems([createEmptyItem(), createEmptyItem()]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...form,
        items: items.map((item) => ({
          description: item.description,
          code: item.code || undefined,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      };
      const response = await apiRequest('create_entry_confirm', {
        method: 'POST',
        token,
        data: payload,
      });
      setMessage(`تأیید ورود با موفقیت ثبت شد. شماره رکورد: ${response.id}`);
      resetForm();
    } catch (err) {
      setError(err.message || 'ثبت فرم ورود ناموفق بود.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>فرم تأیید ورود پس از تعمیر</h2>
        <p>مشخصات اقلام بازگشتی و اطلاعات خرید یا تعمیر را ثبت کنید.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>اطلاعات خرید / تعمیر</h3>
          <div className="form-grid">
            <label className="form-field">
              <span>شماره تأیید ورود</span>
              <input
                type="text"
                name="confirm_no"
                value={form.confirm_no}
                onChange={handleChange}
                required
              />
            </label>
            <label className="form-field">
              <span>تاریخ خرید (شمسی)</span>
              <input
                type="text"
                name="purchase_date_shamsi"
                value={form.purchase_date_shamsi}
                onChange={handleChange}
                placeholder="مثال: 1403/02/10"
              />
            </label>
            <label className="form-field">
              <span>مرکز خرید / تعمیر</span>
              <input
                type="text"
                name="purchase_center"
                value={form.purchase_center}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>شماره درخواست خرید</span>
              <input
                type="text"
                name="purchase_request_code"
                value={form.purchase_request_code}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>نام خریدار / مسئول خرید</span>
              <input
                type="text"
                name="buyer_name"
                value={form.buyer_name}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>نام راننده</span>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>ارجاع به فرم خروج</span>
              <input
                type="text"
                name="reference_exit_form_no"
                value={form.reference_exit_form_no}
                onChange={handleChange}
              />
            </label>
            <label className="form-field">
              <span>ارجاع به فرم تعمیر</span>
              <input
                type="text"
                name="reference_repair_form_no"
                value={form.reference_repair_form_no}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <header className="form-section__header">
            <h3>اقلام تحویلی</h3>
            <button type="button" className="btn btn--secondary" onClick={addItem} disabled={items.length >= 11}>
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
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
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
            {submitting ? 'در حال ثبت...' : 'ثبت تأیید ورود'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetForm} disabled={submitting}>
            پاکسازی فرم
          </button>
        </div>
      </form>
    </div>
  );
}

export default EntryConfirmPage;
