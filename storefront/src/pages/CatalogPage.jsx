import { Link } from 'react-router-dom';

export default function CatalogPage({ equipment }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipment.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
            <h2 className="mt-1 text-lg font-semibold">{item.name}</h2>
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
      {equipment.length === 0 ? <p className="mt-4 text-sm text-slate-500">No equipment available.</p> : null}
    </div>
  );
}
