import { useState } from 'react';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';

interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
}

const POSTS: readonly BlogPost[] = [
  {
    title: 'Designing Lumina’s gradient identity',
    date: 'Coming soon',
    excerpt:
      'A look at how we picked the coral-to-violet gradient that runs through every Lumina screen.',
  },
  {
    title: 'Building Reels with Reanimated',
    date: 'Coming soon',
    excerpt:
      'Notes on gesture-driven vertical video, and keeping playback smooth at 60fps on mid-range devices.',
  },
  {
    title: 'From Expo to bare React Native',
    date: 'Coming soon',
    excerpt: 'Why we migrated away from Expo, and what it took to get there cleanly.',
  },
];

export function Blog() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Container className="py-20 sm:py-28">
      <Reveal as="div" className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
        <p className="mt-6 text-lg text-text-muted">
          Stories from the team behind Lumina — design decisions, engineering notes, and product
          updates. Posts are on their way.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((post, index) => (
          <Reveal key={post.title} as="div" delayMs={index * 80}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex h-full w-full flex-col rounded-2xl border border-border bg-bg-elevated/60 p-6 text-left transition-colors hover:border-border/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-magenta"
              aria-label={`${post.title} — coming soon`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-brand-magenta">
                {post.date}
              </span>
              <h2 className="mt-3 text-lg font-semibold text-text">{post.title}</h2>
              <p className="mt-2 flex-1 text-sm text-text-muted">{post.excerpt}</p>
            </button>
          </Reveal>
        ))}
      </div>

      {modalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-modal-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="blog-modal-heading" className="text-lg font-semibold text-text">
              Coming soon
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              This post is still being written. Check back soon!
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-6 rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
