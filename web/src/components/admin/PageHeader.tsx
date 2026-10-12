import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';

interface PageHeaderProps {
  title: string;
  description?: string;
  onRefresh?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ title, description, onRefresh, actions }: PageHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onRefresh ? (
            <button type="button" onClick={onRefresh} className={buttonClass('secondary')}>
              {t('Refresh')}
            </button>
          ) : null}
        </div>
      </div>
      {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
    </div>
  );
}

export type ButtonTone = 'primary' | 'secondary' | 'danger';

/** Shared admin button styling (keeps every action the same size/shape). */
export function buttonClass(tone: ButtonTone, size: 'sm' | 'md' = 'md'): string {
  const base = `inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
    size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
  }`;
  if (tone === 'primary') return `${base} bg-gradient-brand text-white hover:opacity-90`;
  if (tone === 'danger') return `${base} border border-danger/40 text-danger hover:bg-danger/10`;
  return `${base} border border-border bg-surface text-text hover:bg-text/5`;
}

export const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-faint focus:border-brand-magenta';
