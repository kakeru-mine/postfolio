export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_22px_70px_rgba(17,24,39,0.08)]">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-9 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-slate-100 sm:aspect-[16/10]" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-5 w-4/5 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
