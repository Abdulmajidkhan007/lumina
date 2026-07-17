import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { GitHubIcon } from '../components/icons';

interface TechItem {
  name: string;
  detail: string;
}

const TECH_STACK: readonly TechItem[] = [
  { name: 'React Native', detail: 'Bare CLI, cross-platform mobile app for iOS and Android.' },
  { name: 'Firebase', detail: 'Auth, Firestore, and storage powering the backend.' },
  { name: 'TypeScript', detail: 'Strict typing across the entire codebase — no `any`.' },
  { name: 'React Navigation', detail: 'Typed navigation flows between every screen.' },
];

interface TeamMember {
  name: string;
  role: string;
}

const TEAM: readonly TeamMember[] = [
  { name: 'Abdulmajidkhan', role: 'Mobile Apps & Digital Products' },
];

export function About() {
  return (
    <Container className="py-20 sm:py-28">
      <Reveal as="div" className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About Lumina</h1>
        <p className="mt-6 text-lg text-text-muted">
          Lumina is an independent, Instagram-inspired social app built from scratch as a modern
          showcase of what a small, focused team can ship with React Native. It is not affiliated
          with or endorsed by any existing platform — it is its own product, its own design
          language, and its own roadmap.
        </p>
      </Reveal>

      <Reveal as="section" className="mt-16" aria-labelledby="why-heading">
        <h2 id="why-heading" className="text-2xl font-bold tracking-tight">
          Why Lumina
        </h2>
        <p className="mt-4 max-w-2xl text-text-muted">
          Sharing a photo, a story, or a quick reel should feel instant and joyful. Lumina strips
          away the noise and focuses on four things people actually use every day — Stories,
          Reels, Messages, and Explore — built with careful attention to performance and feel.
        </p>
      </Reveal>

      <section className="mt-16" aria-labelledby="tech-heading">
        <h2 id="tech-heading" className="text-2xl font-bold tracking-tight">
          Technology
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TECH_STACK.map((tech, index) => (
            <Reveal
              key={tech.name}
              as="article"
              delayMs={index * 60}
              className="rounded-2xl border border-border bg-bg-elevated/60 p-6"
            >
              <h3 className="font-semibold text-text">{tech.name}</h3>
              <p className="mt-2 text-sm text-text-muted">{tech.detail}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="team-heading">
        <h2 id="team-heading" className="text-2xl font-bold tracking-tight">
          Team
        </h2>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          {TEAM.map((member) => (
            <Reveal
              key={member.name}
              as="div"
              className="flex items-center gap-4 rounded-2xl border border-border bg-bg-elevated/60 p-6 sm:w-80"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-lg font-bold text-white">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text">{member.name}</p>
                <p className="text-sm text-text-muted">{member.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="div" className="mt-16 flex items-center gap-3 text-sm text-text-muted">
        <GitHubIcon className="h-5 w-5" />
        <a
          href="https://github.com/abdulmajidkhan007"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-text"
        >
          Follow the project on GitHub
        </a>
      </Reveal>
    </Container>
  );
}
