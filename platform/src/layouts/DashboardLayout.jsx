import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  CalendarCheck,
  CalendarDays,
  Users,
  BarChart3,
  Palette,
  UserCog,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNewInquiries } from '../hooks/useNewInquiries';
import { ArkivedMark } from '../components/Wordmark';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/equipment', label: 'Equipment', icon: Package },
  { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarCheck, badgeKey: 'inquiries' },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/dashboard/customers', label: 'Customers', icon: Users },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/settings/branding', label: 'Branding', icon: Palette },
  { to: '/dashboard/settings/team', label: 'Team', icon: UserCog }
];

function NavItems({ collapsed, onNavigate, badges = {} }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const badgeCount = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50'
              }`
            }
          >
            <span className="relative shrink-0">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {badgeCount > 0 && collapsed ? (
                <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-danger-500 ring-2 ring-neutral-950" aria-hidden="true" />
              ) : null}
            </span>
            {collapsed ? (
              <span className="sr-only">
                {item.label}{badgeCount > 0 ? `, ${badgeCount} new` : ''}
              </span>
            ) : (
              <span className="flex-1">{item.label}</span>
            )}
            {!collapsed && badgeCount > 0 ? (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-xs font-semibold text-white"
                aria-label={`${badgeCount} new requests`}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout() {
  const auth = useAuth();
  const { count: inquiryCount } = useNewInquiries();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (auth.user?.role === 'platform_owner') {
    return <Navigate to="/admin" replace />;
  }

  const sidebarWidth = collapsed ? 'lg:grid-cols-[72px_1fr]' : 'lg:grid-cols-[240px_1fr]';
  const badges = { inquiries: inquiryCount };

  return (
    <div className={`grid min-h-screen grid-cols-1 bg-neutral-900 text-neutral-50 ${sidebarWidth}`}>
      {/* Desktop sidebar */}
      <aside className="hidden flex-col border-r border-neutral-750 bg-neutral-950 p-3 lg:flex">
        <div className={`mb-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1`}>
          <Link className="flex items-center gap-2" to="/dashboard">
            <ArkivedMark className="h-7 w-7" />
            {!collapsed ? <span className="text-lg font-bold tracking-tight">arkived</span> : null}
          </Link>
          {!collapsed ? (
            <button
              className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              onClick={() => setCollapsed(true)}
              type="button"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {collapsed ? (
          <button
            className="mx-auto mb-4 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            onClick={() => setCollapsed(false)}
            type="button"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
        <NavItems collapsed={collapsed} badges={badges} />
        <button
          className={`mt-6 flex items-center gap-3 rounded-md border border-neutral-750 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 ${
            collapsed ? 'justify-center' : ''
          }`}
          onClick={auth.signOut}
          type="button"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed ? <span>Sign out</span> : <span className="sr-only">Sign out</span>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-neutral-750 bg-neutral-950 p-3">
            <div className="mb-6 flex items-center justify-between px-1">
              <Link className="flex items-center gap-2" to="/dashboard" onClick={() => setMobileOpen(false)}>
                <ArkivedMark className="h-7 w-7" />
                <span className="text-lg font-bold tracking-tight">arkived</span>
              </Link>
              <button
                className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800"
                onClick={() => setMobileOpen(false)}
                type="button"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <NavItems collapsed={false} onNavigate={() => setMobileOpen(false)} badges={badges} />
            <button
              className="mt-6 flex items-center gap-3 rounded-md border border-neutral-750 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              onClick={auth.signOut}
              type="button"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-750 bg-neutral-900/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1.5 text-neutral-300 hover:bg-neutral-800 lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="hidden text-sm text-neutral-400 sm:block">Rent smarter. Grow faster.</p>
          </div>
          <div className="flex items-center gap-3">
            {auth.user?.email ? (
              <span className="hidden text-sm text-neutral-400 sm:block">{auth.user.email}</span>
            ) : null}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {(auth.user?.email || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
