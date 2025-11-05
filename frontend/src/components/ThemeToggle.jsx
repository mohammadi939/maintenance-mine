import { useTheme } from '../lib/theme.js';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      aria-label="تغییر حالت نمایش"
    >
      <span aria-hidden="true" className="text-lg">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
      <span>{theme === 'dark' ? 'حالت تیره' : 'حالت روشن'}</span>
    </button>
  );
}

export default ThemeToggle;
