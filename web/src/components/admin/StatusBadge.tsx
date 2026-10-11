export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

const TONE: Record<BadgeTone, string> = {
  ok: 'border-ok/30 bg-ok/15 text-ok',
  warn: 'border-warn/30 bg-warn/15 text-warn',
  danger: 'border-danger/30 bg-danger/15 text-danger',
  info: 'border-info/30 bg-info/15 text-info',
  neutral: 'border-border bg-text/5 text-text-muted',
};

/** Small pill; the label always carries the meaning, color only reinforces it. */
export function StatusBadge({ tone, label }: { tone: BadgeTone; label: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>
      {label}
    </span>
  );
}
