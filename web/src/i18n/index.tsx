/**
 * Web i18n — uz / en / ru, like the mobile app (src/i18n).
 *
 * English text is the key: `t('Get the app')`. uz.ts and ru.ts map English to
 * the translation; anything missing falls back to English, so an untranslated
 * string is visible as English instead of a raw key. `{name}` placeholders are
 * filled from the second argument.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { uz } from './uz';
import { ru } from './ru';

export const LANGUAGES = ['uz', 'en', 'ru'] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Lang, string> = { uz: "O'zbek", en: 'English', ru: 'Русский' };

const DICTIONARIES: Record<Lang, Record<string, string>> = { uz, en: {}, ru };
const STORAGE_KEY = 'lumina.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (LANGUAGES as readonly string[]).includes(saved)) return saved as Lang;
  } catch {
    // Storage blocked (private mode) — fall through to the browser language.
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  if (browser.startsWith('ru')) return 'ru';
  if (browser.startsWith('en')) return 'en';
  return 'uz';
}

export type TFunction = (text: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nValue | null>(null);

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  const template = DICTIONARIES[lang][text] ?? text;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted this time; the choice still applies for the session.
    }
  }, []);

  const t = useCallback<TFunction>((text, vars) => translate(lang, text, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}

/** Locale for Intl/toLocaleString, matching the chosen language. */
export function intlLocale(lang: Lang): string {
  return lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US';
}
