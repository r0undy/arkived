import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function CatalogPage({ equipment, tenant }) {
  const location = useLocation();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/catalog`;
  const title = tenant?.name ? `${tenant.name} Catalog` : 'Catalog';
  const description = tenant?.name
    ? `Explore rentable equipment from ${tenant.name}.`
    : 'Explore available rental equipment.';
  const initialCategory = useMemo(
    () => new URLSearchParams(location.search).get('category') || '',
    [location.search]
  );
  const [q, setQ] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const categories = useMemo(
    () => Array.from(new Set(equipment.map((item) => item.category).filter(Boolean))),
    [equipment]
  );

  const filtered = useMemo(() => equipment.filter((item) => {
    if (category && item.category !== category) return false;
    if (q) {
      const hay = `${item.name || ''} ${item.description || ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [equipment, category, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setCategory(initialCategory);
    setPage(1);
  }, [initialCategory]);

  const setCategoryFilter = (value) => {
    setCategory(value);
    setPage(1);
  };

  return (
    <>
      <title>{title}</title>
      <meta content={description} name="description" />
      <link href={canonicalUrl} rel="canonical" />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className="min-w-[220px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Search equipment"
            value={q}
          />
          <button
            className={`rounded-full border px-3 py-1 text-sm ${category === '' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-100'}`}
            onClick={() => setCategoryFilter('')}
            type="button"
          >
            All
          </button>
          {categories.map((entry) => (
            <button
              key={entry}
              className={`rounded-full border px-3 py-1 text-sm ${category === entry ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-100'}`}
              onClick={() => setCategoryFilter(entry)}
              type="button"
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {item.images?.[0]?.storage_url ? (
                <img
                  alt={item.name}
                  className="h-40 w-full rounded-md border border-slate-200 object-cover"
                  loading="lazy"
                  src={item.images[0].storage_url}
                />
              ) : null}
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
              <h2 className="mt-1 text-lg font-semibold">{item.name}</h2>
              <p className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">{item.condition || 'good'}</p>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.description || 'No description available.'}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">PHP {Number(item.daily_rate).toLocaleString()} / day</p>
                <Link
                  className="rounded-md px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  to={`/catalog/${item.id}`}
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 ? <p className="mt-4 text-sm text-slate-500">No equipment available.</p> : null}

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <p>Total: {filtered.length}</p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              type="button"
            >
              Prev
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
