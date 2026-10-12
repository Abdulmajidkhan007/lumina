import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: ReactNode;
}

/** Headline number tile — label on top, value large, optional context line. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <p className="truncate text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {hint ? <div className="mt-1 truncate text-xs text-text-faint">{hint}</div> : null}
    </div>
  );
}
