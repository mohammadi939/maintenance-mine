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
  status: 'خروجی',
  destination: '',
};

function ExitFormPage() {
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
    if (!form.asset.trim()) validation.asset = 'نام تجهیز را وارد کنید.';
    if (!form.manager.trim()) validation.manager = 'نام مسئول خروج الزامی است.';
    if (!form.destination) validation.destination = 'سرنوشت تجهیز را مشخص کنید.';
    if (!form.date) validation.date = 'تاریخ خروج الزامی است.';
    if (!form.status) validation.status = 'وضعیت نهایی را انتخاب کنید.';
    if (!form.description.trim()) validation.description = 'توضیح خروج تجهیز را بنویسید.';
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
      type: 'exit',
      asset: form.asset,
      manager: form.manager,
      date: form.date,
      description: `${form.description} (مقصد/سرنوشت: ${form.destination})`,
      status: form.status,
    });

    success('خروج تجهیز با موفقیت ثبت شد.');
    setForm(initialForm);
    setErrors({});
    navigate('/timeline');
  };

  return (
    <FormCard title="فرم خروج تجهیز" description="فرآیند خروج و سرنوشت تجهیز را ثبت کنید.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">نام تجهیز</label>
          <input
            type="text"
            value={form.asset}
            onChange={handleChange('asset')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="مثال: کمپرسور قدیمی"
          />
          {errors.asset && <p className="mt-1 text-xs text-red-500">{errors.asset}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">مسئول خروج</label>
            <input
              type="text"
              value={form.manager}
              onChange={handleChange('manager')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="مثال: نرگس مرادی"
            />
            {errors.manager && <p className="mt-1 text-xs text-red-500">{errors.manager}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">سرنوشت تجهیز</label>
            <select
              value={form.destination}
              onChange={handleChange('destination')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">انتخاب کنید</option>
              <option value="انبار">انتقال به انبار</option>
              <option value="فروش">فروش / مزایده</option>
              <option value="بازیافت">بازیافت / امحا</option>
              <option value="اهداء">اهداء / انتقال به واحد دیگر</option>
            </select>
            {errors.destination && <p className="mt-1 text-xs text-red-500">{errors.destination}</p>}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">تاریخ خروج (جلالی)</label>
          <JalaliDatePicker value={form.date} onChange={handleDateChange} placeholder="تاریخ خروج را انتخاب کنید" />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">وضعیت نهایی</label>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="خروجی">خروجی</option>
            <option value="تحویل به انبار">تحویل به انبار</option>
            <option value="منتقل شد">منتقل شد</option>
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
            placeholder="دلیل خروج و اقدامات انجام شده"
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
          >
            ثبت خروج
          </button>
        </div>
      </form>
    </FormCard>
  );
}

export default ExitFormPage;
