export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-[var(--primary)] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
