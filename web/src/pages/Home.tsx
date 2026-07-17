import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { Reveal } from '../components/Reveal';
import { PhoneMockup } from '../components/PhoneMockup';
import { ExploreIcon, MessagesIcon, ReelsIcon, StoriesIcon } from '../components/icons';

const GITHUB_RELEASES_URL = '#';

interface Feature {
  title: string;
  description: string;
  icon: typeof StoriesIcon;
}

const FEATURES: readonly Feature[] = [
  {
    title: 'Stories',
    description: 'Share fleeting moments that disappear after 24 hours, ringed in Lumina gradient.',
    icon: StoriesIcon,
  },
  {
    title: 'Reels',
    description: 'Short, punchy vertical videos with music, effects, and seamless discovery.',
    icon: ReelsIcon,
  },
  {
    title: 'Messages',
    description: 'Fast, private conversations with friends — text, photos, and voice notes.',
    icon: MessagesIcon,
  },
  {
    title: 'Explore',
    description: 'A feed tuned to what you love, surfacing creators and moments worth seeing.',
    icon: ExploreIcon,
  },
];

interface Stat {
  value: string;
  label: string;
}

const STATS: readonly Stat[] = [
  { value: '100%', label: 'Open source' },
  { value: 'RN 0.79', label: 'Built on' },
  { value: '4', label: 'Core experiences' },
  { value: '0', label: 'Ads (for now)' },
];

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl"
        />
        <Container className="relative grid grid-cols-1 items-center gap-16 pb-24 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-gradient-brand">Lumina</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-text-muted sm:text-xl">
              Share your brightest moments. Stories, Reels, and Messages — one fast, beautifully
              crafted app for the things worth showing off.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button kind="anchor" href={GITHUB_RELEASES_URL} variant="primary">
                Get the app
              </Button>
              <Button kind="link" to="/app" variant="secondary">
                Open Web App
              </Button>
            </div>
          </div>

          <Reveal className="flex justify-center lg:justify-end" as="div">
            <PhoneMockup />
          </Reveal>
        </Container>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28" aria-labelledby="features-heading">
        <Container>
          <Reveal as="div" className="max-w-2xl">
            <h2 id="features-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to share
            </h2>
            <p className="mt-4 text-text-muted">
              Four core experiences, designed to feel instant and get out of your way.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal
                  key={feature.title}
                  as="article"
                  delayMs={index * 80}
                  className="rounded-2xl border border-border bg-bg-elevated/60 p-6"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{feature.description}</p>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Stats band */}
      <section className="border-y border-border/60 bg-bg-elevated/40 py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <Reveal key={stat.label} as="div" className="text-center">
                <p className="text-3xl font-extrabold text-gradient-brand sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-text-muted">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="py-20 sm:py-28">
        <Container className="text-center">
          <Reveal as="div">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start sharing?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Lumina is free, open source, and built to grow with its community.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button kind="anchor" href={GITHUB_RELEASES_URL} variant="primary">
                Get the app
              </Button>
              <Button kind="link" to="/product" variant="ghost">
                Explore features &rarr;
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
