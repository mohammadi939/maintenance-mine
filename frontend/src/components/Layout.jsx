import ThemeToggle from './ThemeToggle.jsx';
import { Link, useRouter } from '../lib/router.js';

const navItems = [
  { to: '/timeline', label: 'تایم‌لاین' },
  { to: '/forms/entry', label: 'ثبت ورود' },
  { to: '/forms/repair', label: 'ثبت تعمیر' },
  { to: '/forms/exit', label: 'ثبت خروج' },
  { to: '/lists/entries', label: 'لیست ورودها' },
  { to: '/lists/repairs', label: 'لیست تعمیرات' },
  { to: '/lists/exits', label: 'لیست خروج‌ها' },
];

function Layout({ children }) {
  const { path } = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">سامانه مدیریت تعمیرات</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">کنترل ورود، تعمیر و خروج تجهیزات با تمرکز بر فارسی و RTL</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 text-sm">
            {navItems.map((item) => {
              const isActive = path === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`inline-flex items-center rounded-full px-4 py-1.5 transition ${
                      isActive
                        ? 'bg-primary text-white shadow'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default Layout;
