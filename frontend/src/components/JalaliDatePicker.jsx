import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatJalali,
  jalaliMonthLength,
  jalaliToGregorian,
  monthNames,
  parseJalali,
  todayJalali,
} from '../lib/jalali.js';

const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function JalaliDatePicker({ value, onChange, onBlur, placeholder = 'تاریخ را انتخاب کنید' }) {
  const parsedValue = useMemo(() => parseJalali(value), [value]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parsedValue || todayJalali());
  const containerRef = useRef(null);

  useEffect(() => {
    if (parsedValue) {
      setView(parsedValue);
    }
  }, [parsedValue]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        if (onBlur) onBlur();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onBlur]);

  const monthLength = jalaliMonthLength(view.year, view.month);

  const firstDayOffset = useMemo(() => {
    const gregorian = jalaliToGregorian({ year: view.year, month: view.month, day: 1 });
    const day = gregorian.getDay();
    return (day + 1) % 7;
  }, [view.year, view.month]);

  const days = useMemo(() => {
    const blanks = Array.from({ length: firstDayOffset }, () => null);
    const actualDays = Array.from({ length: monthLength }, (_, idx) => idx + 1);
    return [...blanks, ...actualDays];
  }, [firstDayOffset, monthLength]);

  const handleSelectDay = (day) => {
    if (!day) return;
    const nextValue = formatJalali({ year: view.year, month: view.month, day });
    onChange(nextValue);
    setOpen(false);
    if (onBlur) onBlur();
  };

  const goToPrevMonth = () => {
    setView((current) => {
      if (current.month === 1) {
        return { year: current.year - 1, month: 12, day: 1 };
      }
      return { year: current.year, month: current.month - 1, day: 1 };
    });
  };

  const goToNextMonth = () => {
    setView((current) => {
      if (current.month === 12) {
        return { year: current.year + 1, month: 1, day: 1 };
      }
      return { year: current.year, month: current.month + 1, day: 1 };
    });
  };

  return (
    <div ref={containerRef} className="relative w-full text-right">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <span>{value || placeholder}</span>
        <span aria-hidden="true">📅</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-10 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ماه قبل
            </button>
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              {monthNames[view.month - 1]} {view.year}
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ماه بعد
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400">
            {weekDays.map((weekday) => (
              <span key={weekday} className="rounded-full bg-slate-100 py-1 dark:bg-slate-800">
                {weekday}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
            {days.map((day, index) => {
              const selected = parsedValue && day === parsedValue.day && view.month === parsedValue.month && view.year === parsedValue.year;
              return (
                <button
                  type="button"
                  key={`${day || 'blank'}-${index}`}
                  onClick={() => handleSelectDay(day)}
                  disabled={!day}
                  className={`h-9 rounded-full border text-center transition ${
                    selected
                      ? 'border-primary bg-primary text-white shadow'
                      : 'border-transparent text-slate-600 hover:border-primary/30 hover:bg-primary/10 dark:text-slate-300 dark:hover:bg-primary/20'
                  } ${!day ? 'cursor-default opacity-0' : ''}`}
                >
                  {day || ''}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default JalaliDatePicker;
