function FormCard({ title, description, children }) {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="mb-6 space-y-2 text-right">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </header>
        {children}
      </div>
    </section>
  );
}

export default FormCard;
