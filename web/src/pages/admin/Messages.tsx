import { useCallback, useEffect, useState } from 'react';
import {
  deleteContactMessage,
  fetchContactMessages,
  markContactMessage,
  type ContactMessage,
} from '../../lib/contactMessages';
import { formatRelativeTime } from '../../lib/time';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useI18n } from '../../i18n';

/** Contact-form messages from the landing page (newest first). */
export function Messages() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    setMessages(null);
    try {
      setMessages(await fetchContactMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to load messages.'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (m: ContactMessage, status: ContactMessage['status']) => {
    setBusyId(m.id);
    try {
      await markContactMessage(m.id, status);
      setMessages((prev) => prev?.map((x) => (x.id === m.id ? { ...x, status } : x)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (m: ContactMessage) => {
    if (!window.confirm(t('Delete this message?'))) return;
    setBusyId(m.id);
    try {
      await deleteContactMessage(m.id);
      setMessages((prev) => prev?.filter((x) => x.id !== m.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{t('Messages')}</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
        >
          {t('Refresh')}
        </button>
      </div>
      <p className="mb-4 text-sm text-text-muted">{t('Sent from the Contact page of the website.')}</p>

      {messages === null ? (
        <LoadingState />
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyState title={t('No messages yet')} description={t('Contact form messages will appear here.')} />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-2xl border bg-surface p-4 ${
                m.status === 'new' ? 'border-brand-magenta/50' : 'border-border'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{m.name}</span>
                <a href={`mailto:${m.email}`} className="text-sm text-brand-magenta break-all">
                  {m.email}
                </a>
                {m.status === 'new' ? (
                  <span className="rounded-full border border-brand-magenta/40 px-2 py-0.5 text-xs font-semibold text-brand-magenta">
                    {t('new')}
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-text-muted">
                  {m.createdAt ? formatRelativeTime(m.createdAt) : '…'}
                  {m.lang ? ` · ${m.lang.toUpperCase()}` : ''}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent('Lumina')}`}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-semibold transition hover:bg-white/5"
                >
                  {t('Reply by email')}
                </a>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void setStatus(m, m.status === 'new' ? 'read' : 'new')}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-semibold transition hover:bg-white/5 disabled:opacity-50"
                >
                  {m.status === 'new' ? t('Mark as read') : t('Mark as new')}
                </button>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void remove(m)}
                  className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  {t('Delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
