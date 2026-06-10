import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNewInquiries } from '../hooks/useNewInquiries';
import { ArkivedMark } from '../components/Wordmark';
import ActivationLauncher from '../components/ActivationLauncher';

const navSections = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/equipment', label: 'Equipment', icon: Package },
      { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarCheck, badgeKey: 'inquiries' },
      { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
      { to: '/dashboard/customers', label: 'Customers', icon: Users },
      { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 }
    ]
  },
  {
    label: 'Settings',
    items: [
      { to: '/dashboard/settings/branding', label: 'Branding', icon: Palette },
      { to: '/dashboard/settings/team', label: 'Team', icon: UserCog }
    ]
  }
];

const allNavItems = navSections.flatMap((section) => section.items);

/** Resolve a human page title from the current pathname for the top bar. */
function titleForPath(pathname) {
  const exact = allNavItems.find((item) => item.to === pathname);
  if (exact) return exact.label;
  const prefix = allNavItems
    .filter((item) => item.to !== '/dashboard' && pathname.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return prefix ? prefix.label : 'Overview';
}

const initialsOf = (value = '') =>
  value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'A';

function NavItems({ collapsed, onNavigate, badges = {} }) {
  return (
    <nav aria-label="Primary" className="space-y-5">
      {navSections.map((section) => (
        <div key={section.label}>
          {!collapsed ? (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {section.label}
            </p>
          ) : null}
          <div className="space-y-1">
            {section.items.map((item) => {
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
                    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-150 ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-brand-500/12 text-brand-300'
                        : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-neutral-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-500"
                        />
                      ) : null}
                      <span className="relative shrink-0">
                        <Icon
                          className={`h-5 w-5 transition ${isActive ? 'text-brand-300' : 'text-neutral-400 group-hover:text-neutral-200'}`}
                          aria-hidden="true"
                        />
                        {badgeCount > 0 && collapsed ? (
                          <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-danger-500 ring-2 ring-neutral-950 motion-safe:animate-pulse" aria-hidden="true" />
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
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500/90 px-1.5 text-xs font-semibold text-white ring-1 ring-danger-500/40"
                          aria-label={`${badgeCount} new requests`}
                        >
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function WorkspaceHeader({ tenant, collapsed }) {
  const name = tenant?.name || 'arkived';
  return (
    <Link className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`} to="/dashboard">
      {tenant?.logo_url ? (
        <img src={tenant.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
      ) : tenant ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          {initialsOf(tenant.name)}
        </span>
      ) : (
        <ArkivedMark className="h-8 w-8 shrink-0" />
      )}
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-tight text-neutral-50">{name}</span>
          {tenant?.slug ? (
            <span className="block truncate text-xs text-neutral-500">{tenant.slug}.arkived.dev</span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}

function UserFooter({ user, collapsed, onSignOut }) {
  if (collapsed) {
    return (
      <div className="mt-4 flex flex-col items-center gap-2 border-t border-neutral-800 pt-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initialsOf(user?.email)}
        </span>
        <button
          className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
          onClick={onSignOut}
          type="button"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-neutral-800 pt-4">
      <div className="flex items-center gap-3 rounded-lg px-1 py-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initialsOf(user?.email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-100">{user?.email || 'Account'}</p>
          <p className="truncate text-xs capitalize text-neutral-500">{user?.role || 'member'}</p>
        </div>
        <button
          className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
          onClick={onSignOut}
          type="button"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const auth = useAuth();
  const location = useLocation();
  const { count: inquiryCount } = useNewInquiries();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .tenant()
      .then((res) => {
        if (active) setTenant(res?.tenant || null);
      })
      .catch(() => {
        if (active) setTenant(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (auth.user?.role === 'platform_owner') {
    return <Navigate to="/admin" replace />;
  }

  const sidebarWidth = collapsed ? 'lg:grid-cols-[76px_1fr]' : 'lg:grid-cols-[248px_1fr]';
  const badges = { inquiries: inquiryCount };
  const pageTitle = titleForPath(location.pathname);

  return (
    <div className={`grid min-h-dvh grid-cols-1 bg-neutral-900 text-neutral-50 transition-[grid-template-columns] duration-200 ${sidebarWidth}`}>
      {/* Desktop sidebar */}
      <aside className="hidden flex-col border-r border-neutral-750 bg-neutral-950 p-3 lg:flex">
        <div className={`mb-6 flex items-center gap-2 ${collapsed ? 'flex-col' : 'justify-between'} px-1`}>
          <WorkspaceHeader tenant={tenant} collapsed={collapsed} />
          <button
            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <NavItems collapsed={collapsed} badges={badges} />
        </div>
        <UserFooter user={auth.user} collapsed={collapsed} onSignOut={auth.signOut} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 animate-[fadeIn_200ms_ease-out] bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-[drawerInLeft_300ms_ease-out] flex-col border-r border-neutral-750 bg-neutral-950 p-3">
            <div className="mb-6 flex items-center justify-between px-1">
              <WorkspaceHeader tenant={tenant} collapsed={false} />
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800"
                onClick={() => setMobileOpen(false)}
                type="button"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <NavItems collapsed={false} onNavigate={() => setMobileOpen(false)} badges={badges} />
            </div>
            <UserFooter user={auth.user} collapsed={false} onSignOut={auth.signOut} />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-neutral-750 bg-neutral-900/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-neutral-800 lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 className="text-base font-semibold tracking-tight text-neutral-100">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white lg:hidden">
              {initialsOf(auth.user?.email)}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ActivationLauncher />
    </div>
  );
}

