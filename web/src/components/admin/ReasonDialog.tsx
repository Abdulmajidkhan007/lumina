import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { buttonClass, inputClass } from './PageHeader';

interface ReasonDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  /** When true the reason may be left empty. */
  optional?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

/** Native <dialog> asking for a short reason before a moderation action. */
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  optional = false,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const fieldId = useId();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setReason('');
      setError('');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const submit = async () => {
    if (!optional && reason.trim().length === 0) {
      setError(t('Please add a reason.'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-black/60"
    >
      <form
        method="dialog"
        className="flex flex-col gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="text-sm text-text-muted">{description}</p> : null}
        <label htmlFor={fieldId} className="text-sm font-semibold">
          {optional ? t('Note (optional)') : t('Reason')}
        </label>
        <textarea
          id={fieldId}
          value={reason}
          maxLength={500}
          rows={3}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonClass('secondary')}>
            {t('Cancel')}
          </button>
          <button type="submit" disabled={busy} className={buttonClass(tone)}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
