import { LANGUAGES, useI18n } from '../i18n';

/** UZ · EN · RU segmented switch; the choice is remembered on this device. */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('Language')}
      className={`inline-flex rounded-full border border-border bg-bg-elevated/60 p-0.5 ${className}`}
    >
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition ${
            lang === code ? 'bg-gradient-brand text-white' : 'text-text-muted hover:text-text'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
