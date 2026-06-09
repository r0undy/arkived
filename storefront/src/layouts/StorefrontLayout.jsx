import { Link, NavLink, Outlet } from 'react-router-dom';
import PoweredByArkivedBadge from '../components/PoweredByArkivedBadge';

export default function StorefrontLayout({ tenant }) {
  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
            {tenant.name}
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <NavLink to="/" end className="hover:text-slate-600">Home</NavLink>
            <NavLink to="/catalog" className="hover:text-slate-600">Catalog</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500">
          <p>{tenant.contact_email || 'No support email configured'}</p>
          <p>{tenant.contact_phone || 'No support phone configured'}</p>
          <p>{tenant.contact_address || 'No shop address configured'}</p>
          <PoweredByArkivedBadge enabled={tenant.show_watermark} />
        </div>
      </footer>
    </div>
  );
}
