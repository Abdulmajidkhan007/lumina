import { Link } from 'react-router-dom';
import { GitHubIcon } from './icons';

const PRIVACY_POLICY_URL = 'https://abdulmajidkhan007.github.io/lumina/privacy-policy.html';
const GITHUB_URL = 'https://github.com/abdulmajidkhan007/lumina';
const CONTACT_EMAIL = 'santexnika.atoyo@gmail.com';

interface FooterColumn {
  title: string;
  links: ReadonlyArray<{ label: string; to: string } | { label: string; href: string }>;
}

const COLUMNS: readonly FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Product', to: '/product' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy Policy', href: PRIVACY_POLICY_URL },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-bg-elevated/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <span className="text-lg font-bold tracking-tight text-gradient-brand">Lumina</span>
            <p className="mt-3 max-w-xs text-sm text-text-muted">
              Share your brightest moments — stories, reels, and messages in one beautifully
              crafted app.
            </p>
            <a
              href={`https://github.com/abdulmajidkhan007`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
              aria-label="Lumina on GitHub"
            >
              <GitHubIcon className="h-5 w-5" />
              GitHub
            </a>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-text">{column.title}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to} className="text-sm text-text-muted hover:text-text">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-text-muted hover:text-text"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Lumina. All rights reserved.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-text-muted">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}

export { GITHUB_URL, PRIVACY_POLICY_URL, CONTACT_EMAIL };
