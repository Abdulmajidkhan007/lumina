import { useEffect, useState, type ChangeEvent } from 'react';
import {
  SCREEN_LABELS,
  SCREEN_SLOTS,
  fetchLandingScreens,
  removeLandingScreen,
  uploadLandingScreen,
  type LandingScreens,
  type ScreenSlot,
} from '../../lib/landing';
import { useI18n } from '../../i18n';

/**
 * Real screenshots for the landing page, uploaded from the phone. "Feed" also
 * becomes the hero phone on the home page.
 */
export function Landing() {
  const { t } = useI18n();
  const [screens, setScreens] = useState<LandingScreens | null>(null);
  const [busy, setBusy] = useState<ScreenSlot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLandingScreens()
      .then(setScreens)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setScreens({});
      });
  }, []);

  const onPick = (slot: ScreenSlot) => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(slot);
    setError('');
    try {
      const url = await uploadLandingScreen(slot, file);
      setScreens((prev) => ({ ...prev, [slot]: url }));
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : String(err));
    } finally {
      setBusy(null);
    }
  };

  const onRemove = async (slot: ScreenSlot) => {
    setBusy(slot);
    setError('');
    try {
      await removeLandingScreen(slot);
      setScreens((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">{t('Landing page')}</h1>
      <p className="mb-4 text-sm text-text-muted">
        {t('Upload real screenshots from the app. They appear on the Product page; "Feed" is also shown in the phone on the home page.')}
      </p>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {SCREEN_SLOTS.map((slot) => {
          const url = screens?.[slot];
          return (
            <div key={slot} className="flex flex-col gap-2">
              <div className="aspect-[9/19] overflow-hidden rounded-2xl border border-border bg-surface">
                {url ? (
                  <img src={url} alt={t(SCREEN_LABELS[slot])} className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-text-muted">
                    {screens === null ? t('Loading…') : t('No screenshot')}
                  </div>
                )}
              </div>
              <p className="text-center text-sm font-semibold">{t(SCREEN_LABELS[slot])}</p>
              <label
                className={`cursor-pointer rounded-lg bg-gradient-brand px-3 py-1.5 text-center text-xs font-semibold text-white ${
                  busy ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                {busy === slot ? t('Uploading…') : url ? t('Replace') : t('Upload')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPick(slot)(e)} />
              </label>
              {url ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void onRemove(slot)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-semibold transition hover:bg-white/5 disabled:opacity-50"
                >
                  {t('Remove')}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
