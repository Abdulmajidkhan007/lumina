/**
 * Shared loading / empty / error primitives for the app + admin panel, so
 * every list/table consumes the same visual language instead of ad-hoc
 * spinners and text.
 */
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-magenta" />
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="max-w-sm text-sm text-text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-white/5"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-semibold text-text">{title}</p>
      {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-bg-elevated p-4" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
      <div className="mt-4 aspect-square w-full rounded-xl bg-white/10" />
      <div className="mt-4 h-3 w-3/4 rounded bg-white/10" />
    </div>
  );
}

export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <tr className="animate-pulse" aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-full max-w-40 rounded bg-white/10" />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-bg-elevated p-5" aria-hidden="true">
      <div className="h-3 w-20 rounded bg-white/10" />
      <div className="mt-4 h-7 w-16 rounded bg-white/10" />
    </div>
  );
}

/** Wraps children with a top border + spacing, used for admin table shells. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-bg-elevated ${className}`}>
      {children}
    </div>
  );
}
