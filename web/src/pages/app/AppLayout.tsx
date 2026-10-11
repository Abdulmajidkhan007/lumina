import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, type ComponentType, type SVGProps } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../lib/auth';
import { ADMIN_EMAIL } from '../../lib/constants';
import { Avatar } from '../../components/Avatar';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import {
  HeartIcon,
  HomeIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  ProfileIcon,
  SearchIcon,
  SendIcon,
} from '../../components/icons';
import { useI18n } from '../../i18n';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Same five tabs, same order as the mobile app's tab bar. */
const TABS: readonly NavItem[] = [
  { to: '/app', label: 'Home', end: true, icon: HomeIcon },
  { to: '/app/explore', label: 'Explore', end: false, icon: SearchIcon },
  { to: '/app/create', label: 'Create', end: false, icon: PlusCircleIcon },
  { to: '/app/reels', label: 'Reels', end: false, icon: PlayCircleIcon },
  { to: '/app/profile', label: 'Profile', end: false, icon: ProfileIcon },
];

/** Secondary links surfaced in the account menu rather than the main nav. */
const MENU_LINKS = [
  { to: '/app/notifications', label: 'Notifications' },
  { to: '/app/messages', label: 'Messages' },
  { to: '/app/saved', label: 'Saved' },
];

export function AppLayout() {
  const { profile, firebaseUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? t('User');
  const isAdmin = firebaseUser?.email === ADMIN_EMAIL && firebaseUser.emailVerified;

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/app/login', { replace: true });
  };

  const headerIcon =
    'rounded-full p-2 text-text transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-magenta';

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Link
            to="/app"
            className="bg-gradient-brand bg-clip-text text-xl font-extrabold tracking-tight text-transparent"
          >
            Lumina
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {TABS.map((item) => (
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
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {/* Like the app's feed header: activity + direct messages */}
            <Link to="/app/notifications" aria-label={t('Notifications')} className={headerIcon}>
              <HeartIcon className="h-6 w-6" />
            </Link>
            <Link to="/app/messages" aria-label={t('Messages')} className={headerIcon}>
              <SendIcon className="h-6 w-6" />
            </Link>
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t('Account menu')}
                className="rounded-full ring-offset-2 transition focus:outline-none focus:ring-2 focus:ring-brand-magenta"
              >
                <Avatar name={displayName} avatarUrl={profile?.avatarUrl ?? null} size="sm" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
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
                      {t(link.label)}
                    </Link>
                  ))}
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-brand-magenta transition hover:bg-white/5"
                    >
                      {t('Admin panel')}
                    </Link>
                  ) : null}
                  <div className="border-t border-border px-4 py-2.5">
                    <LanguageSwitcher />
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full border-t border-border px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-white/5"
                  >
                    {t('Sign out')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-0 py-6 pb-24 sm:px-4 sm:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar — icons, as in the app */}
      <nav
        aria-label={t('Main navigation')}
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-bg/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden"
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={t(item.label)}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition ${
                  isActive ? 'text-text' : 'text-text-muted'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {t(item.label)}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
