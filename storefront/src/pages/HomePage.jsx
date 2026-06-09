import { Link } from 'react-router-dom';

export default function HomePage({ tenant }) {
  const heroStyle = tenant.banner_image_url
    ? { backgroundImage: `url(${tenant.banner_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {
        background:
          'linear-gradient(120deg, rgba(99,102,241,0.15), rgba(15,23,42,0.04))'
      };

  return (
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
  );
}
