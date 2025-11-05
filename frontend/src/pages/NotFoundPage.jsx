import { Link } from '../lib/router.js';

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">صفحه مورد نظر یافت نشد</h2>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
        آدرس وارد شده در سامانه وجود ندارد. برای مشاهده آخرین رویدادها به تایم‌لاین بازگردید.
      </p>
      <Link
        to="/timeline"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
      >
        بازگشت به تایم‌لاین
      </Link>
    </div>
  );
}

export default NotFoundPage;
