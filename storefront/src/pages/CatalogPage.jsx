import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, PackageSearch } from 'lucide-react';
import Meta from '../components/Meta';
import EquipmentCard from '../components/EquipmentCard';

export default function CatalogPage({ equipment, tenant, catalogError = '' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const title = tenant?.name ? `${tenant.name} Catalog` : 'Catalog';
  const description = tenant?.name
    ? `Explore rentable equipment from ${tenant.name}.`
    : 'Explore available rental equipment.';
  const urlCategory = searchParams.get('category') || '';
  const urlQuery = searchParams.get('q') || '';
  const urlPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const [q, setQ] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [page, setPage] = useState(urlPage);
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

  // Keep the URL in sync with the active filters so links are shareable.
  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (category) next.category = category;
    if (page > 1) next.page = String(page);
    setSearchParams(next, { replace: true });
  }, [q, category, page, setSearchParams]);

  // Adopt external URL changes (back/forward, shared link) into local state.
  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  const setCategoryFilter = (value) => {
    setCategory(value);
    setPage(1);
  };

  return (
    <>
      <Meta tenant={tenant} title={title} description={description} path="/catalog" />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">Find the right gear and send a booking request in minutes.</p>
        {catalogError ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{catalogError}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-auto sm:min-w-65">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-slate-400"
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder="Search equipment"
              value={q}
              aria-label="Search equipment"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${category === '' ? 'border-transparent text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'}`}
              style={category === '' ? { backgroundColor: 'var(--color-primary)' } : undefined}
              onClick={() => setCategoryFilter('')}
              type="button"
            >
              All
            </button>
            {categories.map((entry) => (
              <button
                key={entry}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition ${category === entry ? 'border-transparent text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'}`}
                style={category === entry ? { backgroundColor: 'var(--color-primary)' } : undefined}
                onClick={() => setCategoryFilter(entry)}
                type="button"
              >
                {entry}
              </button>
            ))}
          </div>
        </div>

        {paged.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((item) => (
              <EquipmentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <PackageSearch className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-700">No equipment found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search or category.</p>
          </div>
        )}

        {filtered.length > pageSize ? (
          <div className="mt-8 flex items-center justify-between text-sm text-slate-600">
            <p>{filtered.length} items</p>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                Prev
              </button>
              <span>Page {page} / {totalPages}</span>
              <button
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
