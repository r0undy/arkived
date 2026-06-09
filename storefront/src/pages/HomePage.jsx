import { Link } from 'react-router-dom';

export default function HomePage({ tenant, equipment = [] }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${origin}/`;
  const title = `${tenant.name} | Equipment Rentals`;
  const description = `Browse available equipment and send booking inquiries to ${tenant.name}.`;

  const heroStyle = tenant.banner_image_url
    ? { backgroundImage: `url(${tenant.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {
        background:
          'linear-gradient(120deg, rgba(99,102,241,0.15), rgba(15,23,42,0.04))'
      };

  const categories = Array.from(
    new Set(equipment.map((item) => item.category).filter(Boolean))
  ).slice(0, 6);
  const featured = equipment.slice(0, 6);

  return (
    <>
      <title>{title}</title>
      <meta content={description} name="description" />
      <link href={canonicalUrl} rel="canonical" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10" style={heroStyle}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Equipment rentals</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            Browse available gear, compare rates, and submit a booking inquiry in minutes.
          </p>
          <Link
            className="mt-7 inline-block rounded-md px-5 py-3 font-semibold text-white transition hover:brightness-95"
            style={{ backgroundColor: 'var(--color-primary)' }}
            to="/catalog"
          >
            View catalog
          </Link>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold tracking-tight">Browse by Category</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                to={`/catalog?category=${encodeURIComponent(category)}`}
              >
                {category}
              </Link>
            ))}
            {categories.length === 0 ? <p className="text-sm text-slate-500">No categories yet.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold tracking-tight">Featured Equipment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <Link
                key={item.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
                to={`/catalog/${item.id}`}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
                <p className="mt-1 font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">PHP {Number(item.daily_rate || 0).toLocaleString()} / day</p>
              </Link>
            ))}
            {featured.length === 0 ? <p className="text-sm text-slate-500">No featured items yet.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}
