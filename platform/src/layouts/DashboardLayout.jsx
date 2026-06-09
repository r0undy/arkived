import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/dashboard/equipment', label: 'Equipment' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/analytics', label: 'Analytics' }
];

export default function DashboardLayout() {
  const auth = useAuth();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-neutral-900 text-neutral-50 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-neutral-750 bg-neutral-950 p-4">
        <Link className="mb-6 block text-xl font-semibold tracking-tight" to="/dashboard">
          arkived
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-neutral-200 hover:bg-neutral-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="mt-6 w-full rounded-md border border-neutral-750 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          onClick={auth.signOut}
          type="button"
        >
          Sign out
        </button>
      </aside>
      <div>
        <header className="border-b border-neutral-750 px-6 py-4">
          <p className="text-sm text-neutral-400">Rent smarter. Grow faster.</p>
        </header>
        <main className="mx-auto max-w-7xl p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
