import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';
import { api } from '../lib/api';

const STOREFRONT_DOMAIN = (import.meta.env.VITE_STOREFRONT_DOMAIN || 'arkived.dev')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');

const storefrontUrlFor = (slug) => `https://${slug}.${STOREFRONT_DOMAIN}`;

const PAGE_SIZE = 8;

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

function ShopMark({ partner, className = '' }) {
  if (partner.logo_url) {
    return (
      <img
        src={partner.logo_url}
        alt={partner.name}
        loading="lazy"
        className={`object-contain ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center font-bold text-white ${className}`}
      style={{ backgroundColor: partner.accent_color || '#6366f1' }}
    >
      {initialsOf(partner.name)}
    </span>
  );
}

function PartnerRow({ partner }) {
  const accent = partner.accent_color || '#6366f1';
  const url = storefrontUrlFor(partner.slug);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-6 transition sm:gap-7"
    >
      <ShopMark
        partner={partner}
        className="h-14 w-14 shrink-0 rounded-xl bg-neutral-800 p-1.5 text-lg sm:h-16 sm:w-16"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-white transition group-hover:text-brand-300">
            {partner.name}
          </h2>
          {partner.tagline ? (
            <span className="text-sm font-medium" style={{ color: accent }}>
              {partner.tagline}
            </span>
          ) : null}
        </div>
        {partner.description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-400">
            {partner.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span className="font-mono">{partner.slug}.{STOREFRONT_DOMAIN}</span>
          {partner.location ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {partner.location}
            </span>
          ) : null}
        </div>
      </div>

      <span
        className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-400 transition group-hover:text-white sm:flex"
        aria-hidden="true"
      >
        Visit
        <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .publicPartners()
      .then((res) => {
        if (active) setPartners(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Failed to load partners.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return partners;
    return partners.filter((partner) =>
      [partner.name, partner.tagline, partner.description, partner.location, partner.slug]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [partners, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Reset to the first page whenever the search term changes.
  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div>
      <title>Partners — shops running on Arkived</title>

      <section className="relative overflow-hidden border-b border-neutral-750">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_18%_8%,rgba(99,102,241,0.22),transparent),radial-gradient(45%_45%_at_92%_18%,rgba(14,165,233,0.16),transparent)]"
        />
        <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Partner directory</p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.05] tracking-tight">
            Shops running on Arkived
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-300">
            Real rental businesses with branded storefronts, isolated data, and live booking pipelines.
            Every shop below runs on its own Arkived workspace.
          </p>

          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search partners by name, tag, or location"
              aria-label="Search partners"
              className="w-full rounded-xl border border-neutral-750 bg-neutral-900 py-2.5 pl-10 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {loading ? (
          <p className="text-sm text-neutral-400">Loading partners…</p>
        ) : error ? (
          <p className="text-sm text-danger-300">{error}</p>
        ) : partners.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-300">No live partners yet.</p>
            <Link
              to="/signup"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-400 transition hover:text-brand-300"
            >
              Be the first
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-400">No partners match “{query}”.</p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
              {filtered.length} {filtered.length === 1 ? 'partner' : 'partners'}
              {query ? ` matching “${query}”` : ''}
            </p>
            <div className="mt-2 divide-y divide-neutral-800">
              {pageItems.map((partner) => (
                <PartnerRow key={partner.slug} partner={partner} />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-800 pt-6"
                aria-label="Partners pagination"
              >
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-750 px-3 py-2 text-sm font-medium text-neutral-200 transition hover:border-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      aria-current={pageNumber === currentPage ? 'page' : undefined}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                        pageNumber === currentPage
                          ? 'bg-brand-500 text-white'
                          : 'border border-neutral-750 text-neutral-300 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-750 px-3 py-2 text-sm font-medium text-neutral-200 transition hover:border-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-neutral-800 pt-8 text-sm text-neutral-400">
          <span>Run a rental shop?</span>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1 font-semibold text-brand-400 transition hover:text-brand-300"
          >
            Launch your storefront free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
