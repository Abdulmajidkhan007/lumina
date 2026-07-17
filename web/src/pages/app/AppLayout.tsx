import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../lib/auth';
import { Avatar } from '../../components/Avatar';

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
            to="/"
            className="bg-gradient-brand bg-clip-text text-xl font-extrabold tracking-tight text-transparent"
          >
            Lumina
          </Link>
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
      <main className="mx-auto w-full max-w-5xl px-0 py-6 sm:px-4">
        <Outlet />
      </main>
    </div>
  );
}
