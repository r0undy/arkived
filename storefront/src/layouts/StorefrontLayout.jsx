import { Link, NavLink, Outlet } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import PoweredByArkivedBadge from '../components/PoweredByArkivedBadge';

export default function StorefrontLayout({ tenant }) {
  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={`${tenant.name} logo`} className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                {(tenant.name || 'S').charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-primary-on-white)' }}>
              {tenant.name}
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 transition ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 transition ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`
              }
            >
              Catalog
            </NavLink>
            <Link
              to="/catalog"
              className="ml-1 hidden rounded-lg px-4 py-2 text-sm font-semibold sm:inline-block"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              Rent now
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
                ) : null}
                <span className="text-lg font-bold" style={{ color: 'var(--color-primary-on-white)' }}>{tenant.name}</span>
              </div>
              {tenant.tagline ? <p className="mt-3 max-w-xs text-sm text-slate-500">{tenant.tagline}</p> : null}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Get in touch</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {tenant.contact_email ? (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <a href={`mailto:${tenant.contact_email}`} className="hover:text-slate-900">{tenant.contact_email}</a>
                  </li>
                ) : null}
                {tenant.contact_phone ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <a href={`tel:${tenant.contact_phone}`} className="hover:text-slate-900">{tenant.contact_phone}</a>
                  </li>
                ) : null}
                {tenant.contact_address ? (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span>{tenant.contact_address}</span>
                  </li>
                ) : null}
                {!tenant.contact_email && !tenant.contact_phone && !tenant.contact_address ? (
                  <li className="text-slate-400">Contact details coming soon.</li>
                ) : null}
              </ul>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Explore</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li><Link to="/" className="hover:text-slate-900">Home</Link></li>
                  <li><Link to="/catalog" className="hover:text-slate-900">Catalog</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-sm text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
            <PoweredByArkivedBadge enabled={tenant.show_watermark} />
          </div>
        </div>
      </footer>
    </div>
  );
}
