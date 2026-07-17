import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { Button } from '../components/Button';
import { AndroidIcon, AppleIcon, ExploreIcon, MessagesIcon, ReelsIcon, StoriesIcon } from '../components/icons';

const GITHUB_RELEASES_URL = '#';

interface Capability {
  title: string;
  description: string;
  icon: typeof StoriesIcon;
}

const CAPABILITIES: readonly Capability[] = [
  {
    title: 'Stories that pop',
    description:
      'Gradient rings, smooth transitions, and quick-reply — stories that feel alive without getting in your way.',
    icon: StoriesIcon,
  },
  {
    title: 'Reels built for discovery',
    description:
      'A vertical, swipeable feed tuned for short-form video, with fluid gesture-driven playback.',
    icon: ReelsIcon,
  },
  {
    title: 'Messages that stay fast',
    description:
      'Real-time delivery, typing indicators, and media sharing without ever feeling heavy.',
    icon: MessagesIcon,
  },
  {
    title: 'Explore, tailored to you',
    description: 'A discovery feed that learns what you engage with and surfaces more of it.',
    icon: ExploreIcon,
  },
];

const SCREENSHOT_LABELS = ['Feed', 'Stories', 'Reels', 'Profile'] as const;

export function Product() {
  return (
    <Container className="py-20 sm:py-28">
      <Reveal as="div" className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The product</h1>
        <p className="mt-6 text-lg text-text-muted">
          A closer look at what Lumina does today, and where it&apos;s headed next.
        </p>
      </Reveal>

      <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {CAPABILITIES.map((capability, index) => {
          const Icon = capability.icon;
          return (
            <Reveal
              key={capability.title}
              as="article"
              delayMs={index * 70}
              className="rounded-2xl border border-border bg-bg-elevated/60 p-6"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{capability.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{capability.description}</p>
            </Reveal>
          );
        })}
      </section>

      <section className="mt-20" aria-labelledby="screens-heading">
        <h2 id="screens-heading" className="text-2xl font-bold tracking-tight">
          Screens
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SCREENSHOT_LABELS.map((label, index) => (
            <Reveal
              key={label}
              as="div"
              delayMs={index * 60}
              className="aspect-[9/19] rounded-2xl border border-border bg-gradient-to-br from-brand-coral/10 via-brand-magenta/10 to-brand-violet/10 p-3"
            >
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 text-center">
                <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
                  Screenshot
                </span>
                <span className="text-sm font-semibold text-text-muted">{label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal
        as="section"
        className="mt-20 flex flex-col items-center gap-6 rounded-3xl border border-border bg-bg-elevated/60 p-10 text-center sm:p-14"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Get Lumina on Android</h2>
        <p className="max-w-md text-text-muted">
          Download the latest build straight from GitHub releases. iOS is coming soon.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button kind="anchor" href={GITHUB_RELEASES_URL} variant="primary">
            <AndroidIcon className="h-5 w-5" />
            Download for Android
          </Button>
          <Button kind="button" variant="secondary" disabled aria-disabled="true">
            <AppleIcon className="h-5 w-5" />
            iOS coming soon
          </Button>
        </div>
      </Reveal>
    </Container>
  );
}
