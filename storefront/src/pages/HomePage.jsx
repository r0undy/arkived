import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CalendarCheck, Truck, ShieldCheck, Clock, MapPin, ArrowRight, PackageSearch, Star, ThumbsUp, Headset } from 'lucide-react';
import Meta from '../components/Meta';
import EquipmentCard from '../components/EquipmentCard';
import { LocalBusinessJsonLd } from '../components/StructuredData';

/** Subtle scroll parallax for the hero background, disabled under reduced-motion. */
function useParallax() {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Only animate while the hero is near the viewport.
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        setOffset(rect.top * -0.15);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, offset };
}

const HOW_IT_WORKS = [
  { icon: Search, title: 'Browse', body: 'Explore the catalog and find the gear you need.' },
  { icon: CalendarCheck, title: 'Request', body: 'Pick your dates and send a quick booking inquiry.' },
  { icon: Truck, title: 'Pick up', body: 'We confirm availability and get you ready to go.' }
];

const REASONS = [
  { icon: ShieldCheck, title: 'Quality you can trust', body: 'Every item is inspected and maintained between rentals.' },
  { icon: Headset, title: 'Real, responsive support', body: 'Questions before you book? We reply fast and clearly.' },
  { icon: ThumbsUp, title: 'Simple, fair pricing', body: 'Transparent daily rates and deposits — no surprises.' }
];

export default function HomePage({ tenant, equipment = [], catalogError = '' }) {
  const title = `${tenant.name} | Equipment Rentals`;
  const description =
    tenant.meta_description ||
    `Browse available equipment and send booking inquiries to ${tenant.name}. ${tenant.tagline || ''}`.trim();

  const available = equipment.filter((item) => item.status !== 'archived');
  const categories = Array.from(new Set(available.map((item) => item.category).filter(Boolean))).slice(0, 6);
  const featured = available.slice(0, 6);
  const heroImage = tenant.banner_image_url;
  const parallax = useParallax();

  return (
    <>
      <Meta tenant={tenant} title={title} description={description} path="/" />
      <LocalBusinessJsonLd tenant={tenant} />

      <div className="space-y-12">
        {catalogError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{catalogError}</div>
        ) : null}

        {/* Hero */}
        <section ref={parallax.ref} className="relative overflow-hidden rounded-3xl">
          {heroImage ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 -top-16 -bottom-16 will-change-transform"
              style={{
                backgroundImage: `url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `translate3d(0, ${parallax.offset}px, 0)`
              }}
            />
          ) : null}
          <div
            className="relative flex min-h-105 flex-col justify-center px-6 py-14 sm:px-10 md:min-h-120 md:px-14"
            style={
              heroImage
                ? { background: 'linear-gradient(to top, rgba(15,23,42,0.85), rgba(15,23,42,0.35))' }
                : { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }
            }
          >
            <div className="max-w-2xl">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={`${tenant.name} logo`} className="mb-5 h-14 w-14 rounded-xl bg-white/90 object-contain p-1.5" />
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Equipment rentals</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-5xl">{tenant.name}</h1>
              <p className="mt-4 max-w-xl text-lg text-white/90">
                {tenant.tagline || 'Browse available gear, compare rates, and submit a booking inquiry in minutes.'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  to="/catalog"
                >
                  Browse the catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  to="/catalog"
                >
                  <Search className="h-4 w-4" aria-hidden="true" /> Find equipment
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TrustItem icon={PackageSearch} label={`${available.length} items`} sub="available to rent" />
          <TrustItem icon={Clock} label="Fast replies" sub="we respond quickly" />
          <TrustItem icon={ShieldCheck} label="Trusted gear" sub="quality maintained" />
          <TrustItem icon={MapPin} label="Local pickup" sub={tenant.contact_address ? 'see footer' : 'flexible options'} />
        </section>

        {/* Categories */}
        {categories.length > 0 ? (
          <section>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Browse by category</h2>
              <Link className="text-sm font-semibold text-slate-500 hover:text-slate-800" to="/catalog">View all</Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/catalog?category=${encodeURIComponent(category)}`}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                >
                  <span
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white transition group-hover:scale-110"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <PackageSearch className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold capitalize text-slate-800">{category}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Featured */}
        <section>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Featured equipment</h2>
            <Link className="text-sm font-semibold text-slate-500 hover:text-slate-800" to="/catalog">See the full catalog</Link>
          </div>
          {featured.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => (
                <EquipmentCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No equipment listed yet. Check back soon.
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="rounded-3xl bg-slate-900 px-6 py-12 sm:px-10">
          <h2 className="text-center text-2xl font-bold tracking-tight text-white">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/50">Step {index + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{step.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why rent with us (social proof — graceful value-prop when no testimonials) */}
        <section>
          <div className="flex items-center justify-center gap-1 text-amber-400" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-slate-900">Why customers choose {tenant.name}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <div key={reason.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{reason.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{reason.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-10"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary-foreground)' }}>
            Ready to rent?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'var(--color-primary-foreground)', opacity: 0.9 }}>
            Find the right equipment for your next project and send a booking request in minutes.
          </p>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
            to="/catalog"
          >
            Browse the catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </>
  );
}

function TrustItem({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}
