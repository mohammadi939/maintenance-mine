import { useState } from 'react';
import FormCard from '../components/FormCard.jsx';
import JalaliDatePicker from '../components/JalaliDatePicker.jsx';
import { useEvents } from '../lib/events.js';
import { useRouter } from '../lib/router.js';
import { useToast } from '../lib/toast.js';

const initialForm = {
  asset: '',
  manager: '',
  date: '',
  description: '',
  status: 'فعال',
};

function EntryFormPage() {
  const { navigate } = useRouter();
  const { success, error } = useToast();
  const { addEvent } = useEvents();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (value) => {
    setForm((prev) => ({ ...prev, date: value }));
  };

  const validate = () => {
    const validation = {};
    if (!form.asset.trim()) validation.asset = 'وارد کردن نام تجهیز الزامی است.';
    if (!form.manager.trim()) validation.manager = 'لطفاً نام مسئول دریافت را وارد کنید.';
    if (!form.date) validation.date = 'انتخاب تاریخ الزامی است.';
    if (!form.status) validation.status = 'انتخاب وضعیت الزامی است.';
    if (!form.description.trim()) validation.description = 'لطفاً توضیحات ورود را بنویسید.';
    return validation;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      error('لطفاً خطاهای فرم را برطرف کنید.');
      return;
    }

    addEvent({
      type: 'entry',
      asset: form.asset,
      manager: form.manager,
      date: form.date,
      description: form.description,
      status: form.status,
    });

    success('ورود تجهیز با موفقیت ثبت شد.');
    setForm(initialForm);
    setErrors({});
    navigate('/timeline');
  };

  return (
    <FormCard title="ثبت ورود تجهیز" description="اطلاعات تجهیزات تازه وارد را با دقت تکمیل کنید.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">نام تجهیز</label>
          <input
            type="text"
            value={form.asset}
            onChange={handleChange('asset')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="مثال: ژنراتور اصلی"
          />
          {errors.asset && <p className="mt-1 text-xs text-red-500">{errors.asset}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">مسئول دریافت</label>
          <input
            type="text"
            value={form.manager}
            onChange={handleChange('manager')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="مثال: زهرا کاظمی"
          />
          {errors.manager && <p className="mt-1 text-xs text-red-500">{errors.manager}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">تاریخ ورود (جلالی)</label>
          <JalaliDatePicker value={form.date} onChange={handleDateChange} placeholder="تاریخ را انتخاب کنید" />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">وضعیت تجهیز</label>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="فعال">فعال</option>
            <option value="در انتظار نصب">در انتظار نصب</option>
            <option value="آماده بهره‌برداری">آماده بهره‌برداری</option>
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">توضیحات تکمیلی</label>
          <textarea
            rows="4"
            value={form.description}
            onChange={handleChange('description')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="شرح مختصری از وضعیت تجهیز وارد شده"
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
          >
            ثبت ورود
          </button>
        </div>
      </form>
    </FormCard>
  );
}

export default EntryFormPage;
