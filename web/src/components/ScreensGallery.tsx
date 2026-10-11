import { Reveal } from './Reveal';
import { useI18n } from '../i18n';
import { SCREEN_LABELS, SCREEN_SLOTS, type LandingScreens } from '../lib/landing';

/**
 * Real app screenshots uploaded by the admin (Admin → Landing). Slots without
 * an upload keep a labelled placeholder, so the section never looks broken.
 */
export function ScreensGallery({ screens }: { screens: LandingScreens }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {SCREEN_SLOTS.map((slot, index) => {
        const url = screens[slot];
        const label = t(SCREEN_LABELS[slot]);
        return (
          <Reveal key={slot} as="figure" delayMs={index * 60} className="flex flex-col gap-2">
            <div className="aspect-[9/19] overflow-hidden rounded-[22px] border-[4px] border-white/10 bg-black">
              {url ? (
                <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-coral/10 via-brand-magenta/10 to-brand-violet/10 text-center">
                  <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
                    {t('Screenshot coming soon')}
                  </span>
                </div>
              )}
            </div>
            <figcaption className="text-center text-sm font-semibold text-text-muted">{label}</figcaption>
          </Reveal>
        );
      })}
    </div>
  );
}
