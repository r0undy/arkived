import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="rounded-xl border border-neutral-750 bg-neutral-800 p-10 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <p className="mb-2 text-sm text-brand-400">Arkived SaaS Platform</p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight">Unify your equipment rental operations in one platform.</h1>
        <p className="mt-4 max-w-2xl text-base text-neutral-200">
          Manage inventory, avoid double bookings, and launch a branded storefront under your own subdomain.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded-md bg-brand-500 px-5 py-3 font-semibold hover:bg-brand-600" to="/signup">
            Create tenant workspace
          </Link>
          <Link className="rounded-md border border-neutral-750 px-5 py-3 font-semibold text-neutral-100 hover:bg-neutral-900" to="/login">
            Open dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
