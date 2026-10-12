import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import {
  deleteBroadcast,
  fetchRecentBroadcasts,
  publishBroadcast,
  type Broadcast as BroadcastItem,
} from '../../lib/broadcasts';
import {
  BROADCAST_BODY_MAX,
  BROADCAST_LINK_MAX,
  BROADCAST_TITLE_MAX,
  validateBroadcast,
  type BroadcastDraft,
  type BroadcastErrors,
} from '../../lib/broadcastUtils';
import { formatRelativeTime } from '../../lib/time';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { PageHeader, buttonClass, inputClass } from '../../components/admin/PageHeader';
import { useI18n } from '../../i18n';

const EMPTY: BroadcastDraft = { title: '', body: '', link: '' };

export function Broadcast() {
  const { t } = useI18n();
  const ids = { title: useId(), body: useId(), link: useId() };
  const [draft, setDraft] = useState<BroadcastDraft>(EMPTY);
  const [errors, setErrors] = useState<BroadcastErrors>({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [sent, setSent] = useState<BroadcastItem[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setSent(await fetchRecentBroadcasts());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('Failed to load announcements.'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (field: keyof BroadcastDraft, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateBroadcast(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!window.confirm(t('Send this announcement to every user?'))) return;
    setSending(true);
    setStatus(null);
    try {
      await publishBroadcast(draft);
      setDraft(EMPTY);
      setStatus({ kind: 'ok', text: t('Sent. It appears in every user’s Notifications.') });
      await load();
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : t('Something went wrong.') });
    } finally {
      setSending(false);
    }
  };

  const remove = async (item: BroadcastItem) => {
    if (!window.confirm(t('Delete “{title}”? Users will no longer see it.', { title: item.title }))) return;
    try {
      await deleteBroadcast(item.id);
      setSent((list) => list?.filter((b) => b.id !== item.id) ?? list);
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : t('Something went wrong.') });
    }
  };

  const fieldError = (field: keyof BroadcastDraft) =>
    errors[field] ? (
      <p id={`${ids[field]}-error`} className="mt-1 text-xs text-danger">
        {t(errors[field] ?? '')}
      </p>
    ) : null;

  return (
    <div>
      <PageHeader
        title={t('Broadcast')}
        description={t('An announcement goes to every user’s Notifications (app and web) who signed up before it was sent. Push to phones needs the Cloud Function — see docs/ADMIN-REPORT-2026-10-11.md.')}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <form onSubmit={(e) => void submit(e)} noValidate className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <label htmlFor={ids.title} className="flex justify-between text-sm font-semibold">
            <span>{t('Title')}</span>
            <span className="font-normal text-text-faint tabular-nums">
              {draft.title.trim().length}/{BROADCAST_TITLE_MAX}
            </span>
          </label>
          <input
            id={ids.title}
            value={draft.title}
            maxLength={BROADCAST_TITLE_MAX}
            onChange={(e) => update('title', e.target.value)}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? `${ids.title}-error` : undefined}
            className={`${inputClass} mt-1`}
          />
          {fieldError('title')}

          <label htmlFor={ids.body} className="mt-4 flex justify-between text-sm font-semibold">
            <span>{t('Message')}</span>
            <span className="font-normal text-text-faint tabular-nums">
              {draft.body.trim().length}/{BROADCAST_BODY_MAX}
            </span>
          </label>
          <textarea
            id={ids.body}
            value={draft.body}
            rows={5}
            maxLength={BROADCAST_BODY_MAX}
            onChange={(e) => update('body', e.target.value)}
            aria-invalid={!!errors.body}
            aria-describedby={errors.body ? `${ids.body}-error` : undefined}
            className={`${inputClass} mt-1`}
          />
          {fieldError('body')}

          <label htmlFor={ids.link} className="mt-4 block text-sm font-semibold">
            {t('Link (optional)')}
          </label>
          <input
            id={ids.link}
            type="url"
            inputMode="url"
            placeholder="https://"
            value={draft.link}
            maxLength={BROADCAST_LINK_MAX}
            onChange={(e) => update('link', e.target.value)}
            aria-invalid={!!errors.link}
            aria-describedby={errors.link ? `${ids.link}-error` : undefined}
            className={`${inputClass} mt-1`}
          />
          {fieldError('link')}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={sending} className={buttonClass('primary')}>
              {sending ? t('Sending…') : t('Send to everyone')}
            </button>
            {status ? (
              <p role="status" className={`text-sm ${status.kind === 'ok' ? 'text-ok' : 'text-danger'}`}>
                {status.text}
              </p>
            ) : null}
          </div>
        </form>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-text-muted">{t('Preview')}</h2>
          <article className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-magenta">{t('Announcement')}</p>
            <p className="mt-1 font-semibold">{draft.title.trim() || t('Title')}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-text-muted">{draft.body.trim() || t('Message')}</p>
            {draft.link.trim() ? <p className="mt-2 truncate text-sm text-brand-magenta">{draft.link.trim()}</p> : null}
          </article>
        </div>
      </div>

      <h2 className="mb-2 mt-8 text-lg font-bold">{t('Sent announcements')}</h2>
      {loadError ? (
        <ErrorState message={loadError} onRetry={() => void load()} />
      ) : sent === null ? (
        <LoadingState />
      ) : sent.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState title={t('Nothing sent yet')} />
        </div>
      ) : (
        <ul className="space-y-2">
          {sent.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{b.title}</p>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-text-muted">{b.body}</p>
                {b.link ? (
                  <a href={b.link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-brand-magenta hover:underline">
                    {b.link}
                  </a>
                ) : null}
                <p className="mt-1 text-xs text-text-faint">
                  {formatRelativeTime(b.createdAt)}
                  {b.createdByEmail ? ` · ${b.createdByEmail}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => void remove(b)} className={`${buttonClass('danger', 'sm')} self-start`}>
                {t('Delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
