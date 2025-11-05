import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import Pagination from '../components/Pagination.jsx';
import { eventTypeMeta, useEvents } from '../lib/events.js';

const PAGE_SIZE = 5;

function ExitListPage() {
  const { getEventsByType } = useEvents();
  const [page, setPage] = useState(1);
  const allExits = getEventsByType('exit');

  const columns = useMemo(
    () => [
      { header: 'نام تجهیز', accessor: 'asset' },
      { header: 'مسئول خروج', accessor: 'manager' },
      { header: 'تاریخ خروج', accessor: 'date' },
      { header: 'وضعیت', accessor: 'status' },
      {
        header: 'توضیحات',
        accessor: 'description',
        render: (item) => <span className="text-xs text-slate-500 dark:text-slate-300">{item.description}</span>,
      },
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(allExits.length / PAGE_SIZE));
  const currentItems = useMemo(
    () => allExits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allExits, page]
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 text-right">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لیست خروج تجهیزات</h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          تجهیزات خارج‌شده به همراه وضعیت نهایی و توضیحات تکمیلی نمایش داده می‌شوند.
        </p>
      </header>
      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary shadow-sm dark:border-primary/30 dark:bg-primary/10">
        <span>تعداد کل خروج‌ها: {allExits.length}</span>
        <span>نوع رویداد: {eventTypeMeta.exit.label}</span>
      </div>
      <DataTable columns={columns} data={currentItems} emptyMessage="خروجی ثبت نشده است." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}

export default ExitListPage;
