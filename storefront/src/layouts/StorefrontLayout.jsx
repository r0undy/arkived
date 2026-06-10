import { Link, NavLink, Outlet } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, FileText, Clock } from 'lucide-react';
import PoweredByArkivedBadge from '../components/PoweredByArkivedBadge';
import { useQuoteCart } from '../hooks/useQuoteCart';
import { getOpenState, hasBusinessHours, listBusinessHours } from '../lib/businessHours';

const whatsappLink = (phone) => {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

const mapsLink = (address) =>
  address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';

export default function StorefrontLayout({ tenant }) {
  const waLink = whatsappLink(tenant.contact_phone);
  const mapLink = mapsLink(tenant.contact_address);
  const { count: quoteCount } = useQuoteCart(tenant.slug);
  const showHours = hasBusinessHours(tenant.business_hours);
  const openState = showHours ? getOpenState(tenant.business_hours) : null;
  return (
    <div className="flex min-h-dvh flex-col text-slate-900">
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
            <NavLink
              to="/quote"
              className={({ isActive }) =>
                `relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 transition ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`
              }
              aria-label={quoteCount > 0 ? `Quote, ${quoteCount} items` : 'Quote'}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Quote</span>
              {quoteCount > 0 ? (
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {quoteCount > 99 ? '99+' : quoteCount}
                </span>
              ) : null}
            </NavLink>
            {openState ? (
              <span
                className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                  openState.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
                title={`${openState.todayLabel}: ${openState.todayRange}`}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                {openState.isOpen ? 'Open now' : 'Closed'}
              </span>
            ) : null}
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
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                      >
                        <MessageCircle className="h-3 w-3" aria-hidden="true" /> WhatsApp
                      </a>
                    ) : null}
                  </li>
                ) : null}
                {tenant.contact_address ? (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {mapLink ? (
                      <a href={mapLink} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 hover:underline">
                        {tenant.contact_address}
                      </a>
                    ) : (
                      <span>{tenant.contact_address}</span>
                    )}
                  </li>
                ) : null}
                {!tenant.contact_email && !tenant.contact_phone && !tenant.contact_address ? (
                  <li className="text-slate-400">Contact details coming soon.</li>
                ) : null}
              </ul>

              {showHours ? (
                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">Hours</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        openState.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${openState.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
                      {openState.isOpen ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {listBusinessHours(tenant.business_hours).map((row) => (
                      <li key={row.key} className={`flex items-center justify-between gap-4 ${row.key === openState.todayKey ? 'font-semibold text-slate-900' : ''}`}>
                        <span>{row.label}</span>
                        <span className="tabular-nums">{row.range}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Explore</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li><Link to="/" className="hover:text-slate-900">Home</Link></li>
                  <li><Link to="/catalog" className="hover:text-slate-900">Catalog</Link></li>
                  <li><Link to="/track" className="hover:text-slate-900">Track your request</Link></li>
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
