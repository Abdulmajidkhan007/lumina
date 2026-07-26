import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../lib/auth';
import { Avatar } from '../../components/Avatar';

const NAV = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/explore', label: 'Explore', end: false },
  { to: '/app/reels', label: 'Reels', end: false },
  { to: '/app/create', label: 'Create', end: false },
  { to: '/app/messages', label: 'Messages', end: false },
  { to: '/app/profile', label: 'Profile', end: false },
];

/** Secondary links surfaced in the account menu rather than the main nav. */
const MENU_LINKS = [
  { to: '/app/notifications', label: 'Notifications' },
  { to: '/app/saved', label: 'Saved' },
];

export function AppLayout() {
  const { profile, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? 'User';

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/app/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            to="/app"
            className="bg-gradient-brand bg-clip-text text-xl font-extrabold tracking-tight text-transparent"
          >
            Lumina
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:bg-white/5 ${
                    isActive ? 'text-text' : 'text-text-muted'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="rounded-full ring-offset-2 transition focus:outline-none focus:ring-2 focus:ring-brand-magenta"
            >
              <Avatar name={displayName} avatarUrl={profile?.avatarUrl ?? null} size="sm" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
              >
                <div className="border-b border-border px-4 py-2">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-text-muted">{firebaseUser?.email}</p>
                </div>
                {MENU_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm transition hover:bg-white/5"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-white/5"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-0 py-6 pb-24 sm:px-4 sm:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-bg/90 py-2 backdrop-blur sm:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `px-4 py-1 text-xs font-semibold transition ${isActive ? 'text-text' : 'text-text-muted'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
