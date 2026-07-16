/**
 * Lumina — react-i18next type augmentation
 *
 * Wires the English resource bundle's shape into `CustomTypeOptions` so
 * `t()` calls are typo-checked and autocompleted against real keys across
 * the app. The Uzbek bundle is expected to mirror this exact key shape.
 */

import 'react-i18next';

import type en from './locales/en.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}
