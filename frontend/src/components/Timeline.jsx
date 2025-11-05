import { eventTypeMeta } from '../lib/events.js';

function Timeline({ events }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        رویدادی برای نمایش وجود ندارد.
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-y-0 right-4 w-0.5 bg-gradient-to-b from-primary via-slate-300 to-transparent dark:via-slate-700" aria-hidden="true" />
      {sorted.map((item) => {
        const meta = eventTypeMeta[item.type];
        return (
          <div key={item.id} className="relative rounded-2xl border border-slate-200 bg-white p-6 pr-14 shadow-sm transition hover:border-primary/60 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <span className="absolute right-2 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
              {item.date.slice(-2)}
            </span>
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                {meta.label}
              </span>
              <span className="text-xs text-slate-400">{item.date}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.asset}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300">
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">مسئول: {item.manager}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">وضعیت: {item.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
