export function UsageMeter({
  label,
  value,
  limit,
  unit,
  unlimited = false,
}: {
  label: string;
  value: number;
  limit: number;
  unit: string;
  unlimited?: boolean;
}) {
  const percentage = unlimited
    ? 0
    : Math.min(100, Math.round((value / limit) * 100));
  const nearLimit = percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-bold">{label}</span>
        <span className={nearLimit ? "font-bold text-amber-600" : "text-slate-500"}>
          {unlimited ? `${value}${unit}（無制限）` : `${value} / ${limit}${unit}`}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={nearLimit ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-[var(--primary)]"}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
