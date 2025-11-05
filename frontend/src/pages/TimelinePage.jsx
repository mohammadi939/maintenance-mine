import Timeline from '../components/Timeline.jsx';
import { useEvents } from '../lib/events.js';

function TimelinePage() {
  const { events } = useEvents();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-right shadow-sm dark:border-primary/30 dark:bg-primary/10">
        <h2 className="text-xl font-semibold text-primary">نمای کلی رویدادها</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          رویدادهای مربوط به ورود، تعمیر و خروج تجهیزات در این تایم‌لاین با تفکیک رنگ نمایش داده می‌شوند.
        </p>
      </div>
      <Timeline events={events} />
    </div>
  );
}

export default TimelinePage;
