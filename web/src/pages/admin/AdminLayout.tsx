import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/activity', label: 'Activity', end: false },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <span className="bg-gradient-brand bg-clip-text text-lg font-extrabold text-transparent">
            Lumina
          </span>
          <span className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Admin
          </span>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav
          aria-label="Admin sections"
          className="flex shrink-0 gap-2 overflow-x-auto md:w-44 md:flex-col"
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-gradient-brand text-white' : 'text-text-muted hover:bg-white/5'
                }`
              }
            >
              {l.label}
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
