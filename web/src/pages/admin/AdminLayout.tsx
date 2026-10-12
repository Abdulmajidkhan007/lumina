import { NavLink, Outlet } from 'react-router-dom';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { Segmented } from '../../components/admin/Segmented';
import { useStaff } from '../../contexts/StaffContext';
import { useAdminTheme, type AdminTheme } from '../../hooks/useAdminTheme';
import { useI18n } from '../../i18n';

interface AdminLink {
  to: string;
  label: string;
  end: boolean;
  /** Admin-only sections are hidden from moderators. */
  adminOnly: boolean;
}

const links: readonly AdminLink[] = [
  { to: '/admin', label: 'Overview', end: true, adminOnly: false },
  { to: '/admin/users', label: 'Users', end: false, adminOnly: false },
  { to: '/admin/reports', label: 'Reports', end: false, adminOnly: false },
  { to: '/admin/activity', label: 'Activity', end: false, adminOnly: false },
  { to: '/admin/broadcast', label: 'Broadcast', end: false, adminOnly: true },
  { to: '/admin/messages', label: 'Messages', end: false, adminOnly: true },
  { to: '/admin/landing', label: 'Landing', end: false, adminOnly: true },
];

export function AdminLayout() {
  const { t } = useI18n();
  const { isAdmin, role } = useStaff();
  const [theme, setTheme] = useAdminTheme();
  const visible = links.filter((l) => isAdmin || !l.adminOnly);

  return (
    <div data-theme={theme} className="admin-shell min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
          <span className="bg-gradient-brand bg-clip-text text-lg font-extrabold text-transparent">Lumina</span>
          <span className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {role === 'moderator' ? t('Moderator') : t('Admin')}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Segmented<AdminTheme>
              label={t('Theme')}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'system', label: t('Auto') },
                { value: 'light', label: t('Light') },
                { value: 'dark', label: t('Dark') },
              ]}
            />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:gap-6 md:py-6">
        <nav aria-label={t('Admin sections')} className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 md:mx-0 md:w-44 md:flex-col md:px-0">
          {visible.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-gradient-brand text-white' : 'text-text-muted hover:bg-text/5 hover:text-text'
                }`
              }
            >
              {t(l.label)}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
