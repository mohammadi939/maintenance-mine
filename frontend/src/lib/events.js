import { createContext, useContext, useMemo, useState } from 'react';

const EventContext = createContext();

const baseEvents = [
  {
    id: 1,
    type: 'entry',
    asset: 'ژنراتور اصلی خط ۲',
    manager: 'مریم آقاجانی',
    date: '1403/05/10',
    description: 'ورود ژنراتور برای نصب در بخش جنوبی کارخانه ثبت شد.',
    status: 'فعال',
    createdAt: '2024-07-31T08:00:00.000Z',
  },
  {
    id: 2,
    type: 'repair',
    asset: 'پمپ آب رزرو',
    manager: 'آرمان رضایی',
    date: '1403/05/15',
    description: 'پمپ آب با لرزش غیرمعمول به کارگاه تعمیر منتقل شد.',
    status: 'در حال پیگیری',
    createdAt: '2024-08-02T10:15:00.000Z',
  },
  {
    id: 3,
    type: 'exit',
    asset: 'کمپرسور قدیمی',
    manager: 'سهیلا نیازی',
    date: '1403/05/20',
    description: 'کمپرسور پس از جایگزینی با مدل جدید از چرخه بهره‌برداری خارج شد.',
    status: 'خروجی',
    createdAt: '2024-08-05T09:30:00.000Z',
  },
];

export const eventTypeMeta = {
  entry: { label: 'ورود تجهیز', badge: 'bg-entry/20 text-entry border border-entry/40' },
  repair: { label: 'تعمیر تجهیز', badge: 'bg-repair/20 text-repair border border-repair/40' },
  exit: { label: 'خروج تجهیز', badge: 'bg-exit/20 text-exit border border-exit/40' },
};

export function EventProvider({ children }) {
  const [events, setEvents] = useState(baseEvents);

  const addEvent = (event) => {
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...event,
      },
    ]);
  };

  const value = useMemo(() => ({
    events,
    addEvent,
    getEventsByType: (type) => events.filter((item) => item.type === type),
  }), [events]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvents باید درون EventProvider استفاده شود');
  return context;
}
