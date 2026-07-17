import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CloseIcon, MenuIcon } from './icons';

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Product', to: '/product' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on every route change so it never lingers open.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile menu is open, and always restore it on unmount.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const linkClassName = ({ isActive }: { isActive: boolean }): string =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-text' : 'text-text-muted hover:text-text'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <NavLink to="/" className="text-lg font-bold tracking-tight text-gradient-brand" aria-label="Lumina home">
          Lumina
        </NavLink>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClassName} end={item.to === '/'}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <NavLink
            to="/app"
            className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-magenta/20 transition-transform hover:scale-105"
          >
            Sign in
          </NavLink>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-text md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </nav>

      {menuOpen ? (
        <div id="mobile-menu" className="border-t border-border/60 bg-bg px-4 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-3 text-base font-medium ${
                      isActive ? 'bg-white/5 text-text' : 'text-text-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <NavLink
                to="/app"
                className="block rounded-full bg-gradient-brand px-4 py-3 text-center text-base font-semibold text-white"
              >
                Sign in
              </NavLink>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
