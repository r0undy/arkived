import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  Palette,
  Globe,
  BarChart3,
  Users,
  Check,
  Sparkles,
  Workflow,
  Lock,
  Infinity as InfinityIcon,
  UserPlus,
  Plus
} from 'lucide-react';
import YouTubeEmbed from '../components/marketing/YouTubeEmbed';
import TeamCarousel from '../components/marketing/TeamCarousel';
import { api } from '../lib/api';
import heroModel from '../assets/aki.png';

// TODO: replace with the real Arkived demo video ID once recorded.
const DEMO_VIDEO_ID = 'YE7VzlLtp-4';

const STOREFRONT_DOMAIN = (import.meta.env.VITE_STOREFRONT_DOMAIN || 'arkived.dev')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');

const storefrontUrlFor = (slug) => `https://${slug}.${STOREFRONT_DOMAIN}`;

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const STATS = [
  { icon: Workflow, value: '6-stage', label: 'booking pipeline, conflict-checked end to end' },
  { icon: Globe, value: '1 subdomain', label: 'branded storefront per shop, live in minutes' },
  { icon: Lock, value: '100%', label: 'tenant data isolation by default' },
  { icon: InfinityIcon, value: 'Unlimited', label: 'items, customers, and bookings' }
];

const HOW_STEPS = [
  {
    icon: UserPlus,
    title: 'Create your workspace',
    body: 'Sign up and claim your subdomain. Your tenant is isolated from day one — no shared data, no setup calls.'
  },
  {
    icon: Palette,
    title: 'Brand your storefront',
    body: 'Drop in your logo and accent colors in the branding studio. Preview live, with a built-in contrast check.'
  },
  {
    icon: CalendarCheck,
    title: 'Take bookings',
    body: 'Inquiries from your storefront land in the dashboard as bookings you can move from reserved to closed.'
  }
];

const FAQ = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. You can create your workspace, brand your storefront, and take real bookings without entering any payment details.'
  },
  {
    q: 'Is my data shared with other shops?',
    a: 'Never. Every tenant is fully isolated at the database level, so your inventory, customers, and bookings are only ever visible to your team.'
  },
  {
    q: 'Can I use my own branding?',
    a: 'Yes. You get your own subdomain plus a branding studio for your logo and accent colors — with an accessibility contrast check before you publish.'
  },
  {
    q: 'What happens when a customer inquires?',
    a: 'Storefront inquiries arrive in your dashboard as bookings. From there you move them through reserved, payment, dispatched, returned, inspected, and closed.'
  }
];

const STORY = [
  {
    title: 'Spreadsheets break at scale',
    body: 'Small rental shops were tracking six-figure inventory in shared sheets and group chats. One missed cell meant a double-booked camera on a wedding day.'
  },
  {
    title: 'The storefront is the product',
    body: 'A customer inquiry shouldn’t live in someone’s DMs. We made the public storefront and the operator dashboard two sides of the same record.'
  },
  {
    title: 'You own your shop',
    body: 'Isolated data, your own branding, your own subdomain. Arkived should feel like your software — not a seat you’re renting back.'
  }
];

const TEAM = [
  { name: 'Rhandie J. Sales Jr.', role: 'Full-stack DevOps & Cloud Engineer', tone: 'bg-linear-to-br from-brand-500 to-info-500' },
  { name: 'Donna Reymatias', role: 'Quality Assurance & Researcher', tone: 'bg-linear-to-br from-info-500 to-brand-600' },
  { name: 'Emmanuel Oaing', role: 'Quality Assurance & Researcher', tone: 'bg-linear-to-br from-success-500 to-info-500' },
  { name: 'Kerby Correa', role: 'Quality Assurance & Researcher', tone: 'bg-linear-to-br from-warning-500 to-danger-500' },
  { name: 'Nicholas Jose', role: 'Quality Assurance & Researcher', tone: 'bg-linear-to-br from-danger-500 to-brand-500' },
  { name: 'Samantha Paquibot', role: 'Quality Assurance & Researcher', tone: 'bg-linear-to-br from-brand-600 to-success-500' },
  { name: 'Akisha Lei de Castro', role: 'Quality Assurance & Researcher', tone: 'bg-linear-to-br from-info-500 to-success-500' }
];

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

function LiveShops({ partners }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  // Auto-rotate the spotlight until the visitor interacts.
  useEffect(() => {
    if (hovering || partners.length <= 1) return undefined;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % partners.length);
    }, 3200);
    return () => clearInterval(id);
  }, [hovering, partners.length]);

  const active = partners[Math.min(activeIndex, partners.length - 1)];
  const accent = active?.accent_color || '#6366f1';

  return (
    <div className="border-t border-neutral-750 bg-neutral-950/40 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Live shops running on Arkived
        </p>

        <div
          className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr]"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Spotlight preview */}
          <a
            href={storefrontUrlFor(active.slug)}
            target="_blank"
            rel="noreferrer"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-750 bg-neutral-900 p-7 transition hover:border-neutral-700"
            style={{ '--accent': accent }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ backgroundColor: accent }}
            />
            <div className="flex items-center gap-4">
              <ShopMark
                key={active.slug}
                partner={active}
                className="h-16 w-16 shrink-0 rounded-2xl text-2xl ring-1 ring-white/10 motion-safe:animate-[fadeIn_0.4s_ease-out]"
              />
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold tracking-tight text-white">{active.name}</h3>
                <p className="mt-0.5 truncate text-sm text-neutral-400">
                  {active.slug}.{STOREFRONT_DOMAIN}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: accent }}
              >
                Visit storefront
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
              {partners.length > 1 ? (
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {partners.map((partner, index) => (
                    <span
                      key={partner.slug}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: index === activeIndex ? '1.25rem' : '0.375rem',
                        backgroundColor: index === activeIndex ? accent : '#2d3f55'
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </a>

          {/* Selectable shop list */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
            {partners.map((partner, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={partner.slug}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => window.open(storefrontUrlFor(partner.slug), '_blank', 'noopener')}
                  aria-label={`Preview ${partner.name}`}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? 'border-brand-500/60 bg-neutral-800'
                      : 'border-neutral-750 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-800/60'
                  }`}
                >
                  <ShopMark partner={partner} className="h-9 w-9 shrink-0 rounded-lg text-xs" />
                  <span className="block min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">
                    {partner.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .publicPartners()
      .then((res) => {
        if (active) setPartners(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (active) setPartners([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-750">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_18%_8%,rgba(99,102,241,0.22),transparent),radial-gradient(45%_45%_at_92%_18%,rgba(14,165,233,0.16),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="motion-safe:animate-[fadeInUp_0.5s_ease-out]">
            <h1 className="mt-5 text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight">
              Stop juggling spreadsheets.
              <span className="bg-linear-to-r from-brand-400 via-info-400 to-brand-300 bg-clip-text text-transparent"> Start renting smarter.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-neutral-300">
              Arkived runs your inventory, bookings, customers, and a branded storefront from one place — so every inquiry becomes a booking without the copy-paste.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-brand-600"
                to="/signup"
              >
                Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-750 px-6 py-3 font-semibold text-neutral-100 transition hover:bg-neutral-800"
                href="#demo"
              >
                Watch the demo
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-400">
              {['No credit card', 'Launch in minutes', 'Your own subdomain'].map((perk) => (
                <li key={perk} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success-500" aria-hidden="true" /> {perk}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="relative mx-auto w-full max-w-lg mask-[linear-gradient(to_bottom,black_62%,transparent)] lg:ml-auto lg:mr-0 lg:max-w-xl">
              <img
                src={heroModel}
                alt="Arkived operator"
                className="w-full select-none object-contain drop-shadow-2xl"
                draggable="false"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="scroll-mt-24 border-b border-neutral-750">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">See it in action</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A two-minute tour</h2>
            <p className="mt-3 text-neutral-400">Watch how a storefront inquiry becomes a fully-tracked booking inside Arkived.</p>
          </div>
          <div className="relative mt-10">
            <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-3xl bg-linear-to-r from-brand-500/15 to-info-500/15 blur-2xl" />
            <YouTubeEmbed videoId={DEMO_VIDEO_ID} title="Arkived product demo" />
          </div>
        </div>
      </section>

      {/* Capability stats band */}
      <section className="border-b border-neutral-750 bg-neutral-900">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden border-x border-neutral-750 px-0 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.value} className="bg-neutral-900 p-6 transition hover:bg-neutral-800/60">
                <Icon className="h-5 w-5 text-brand-400" aria-hidden="true" />
                <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-50">{stat.value}</p>
                <p className="mt-1 text-sm text-neutral-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Live shops */}
        {partners.length > 0 ? (
          <LiveShops partners={partners} />
        ) : null}
      </section>

      {/* Features — bento */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Everything in one place</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From first inquiry to final inspection</h2>
          <p className="mt-3 text-neutral-400">No bolt-ons, no integrations to babysit. The operator dashboard and the customer storefront share one source of truth.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* Feature 1 — large */}
          <article className="group relative overflow-hidden rounded-3xl border border-neutral-750 bg-neutral-800 p-7 sm:col-span-2 lg:row-span-2">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl transition group-hover:bg-brand-500/25" />
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Globe className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-2xl font-bold tracking-tight">Your own branded storefront</h3>
            <p className="mt-2 max-w-md text-neutral-400">
              Launch a customer-facing rental site on your subdomain. Pick your colors and logo in the branding studio — inquiries land directly in your dashboard as bookings.
            </p>
            <div className="mt-7 overflow-hidden rounded-xl border border-neutral-750">
              <div className="flex items-center gap-2 border-b border-neutral-750 bg-neutral-900 px-3 py-2 text-[11px] text-neutral-500">
                <span className="h-2 w-2 rounded-full bg-neutral-700" />
                <span className="h-2 w-2 rounded-full bg-neutral-700" />
                <span className="truncate">yourshop.arkived.dev</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-neutral-900/60 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="aspect-4/3 rounded-md bg-linear-to-br from-neutral-750 to-neutral-800" />
                    <div className="h-1.5 w-3/4 rounded bg-neutral-750" />
                    <div className="h-1.5 w-1/2 rounded bg-neutral-750" />
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Smaller features */}
          {[
            { icon: Boxes, title: 'Inventory that stays honest', body: 'Condition, photos, and maintenance history per item — with soft-delete so nothing silently vanishes.' },
            { icon: CalendarCheck, title: 'A real booking pipeline', body: 'Reserved → payment → dispatched → returned → inspected → closed, with conflict checks built in.' },
            { icon: Palette, title: 'Branding studio', body: 'Live preview, accent colors, and an accessibility contrast check before you ever hit save.' },
            { icon: BarChart3, title: 'Analytics that matter', body: 'Revenue, utilization, and demand at a glance — clean charts, tidy figures.' }
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group rounded-3xl border border-neutral-750 bg-neutral-800 p-6 transition hover:-translate-y-1 hover:border-brand-500/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 transition group-hover:bg-brand-500 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-750 bg-neutral-950/40">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Live in three steps</h2>
            <p className="mt-3 text-neutral-400">No onboarding calls, no migrations. Go from sign-up to your first booking the same afternoon.</p>
          </div>

          <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 hidden border-t border-dashed border-neutral-750 md:block" />
            {HOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center md:text-left">
                  <span className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/40 bg-neutral-900 text-brand-300 md:mx-0">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why we built it */}
      <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Why we built Arkived</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Rentals are a relationship business. The software should help, not hurt.</h2>
            <p className="mt-4 text-neutral-400">We kept seeing great local shops held back by tools that didn’t fit. So we built the one we wished they had.</p>
          </div>
          <ol className="relative space-y-8 border-l border-neutral-750 pl-8">
            {STORY.map((item, index) => (
              <li key={item.title} className="relative">
                <span className="absolute -left-12 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-brand-500/40 bg-neutral-900 text-sm font-bold text-brand-300">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-400">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-neutral-750 bg-neutral-950/40">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
                <Users className="h-4 w-4" aria-hidden="true" /> Meet the team
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Seven builders, one platform</h2>
              <p className="mt-3 text-neutral-400">Designed, built, and shipped by the people below. Hover a card to say hello.</p>
            </div>
          </div>
          <div className="mt-10">
            <TeamCarousel members={TEAM} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-750">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered</h2>
          </div>
          <div className="mt-10 divide-y divide-neutral-750 overflow-hidden rounded-2xl border border-neutral-750 bg-neutral-900">
            {FAQ.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-neutral-100 transition hover:bg-neutral-800/60">
                  {item.q}
                  <Plus className="h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
                </summary>
                <p className="px-5 pb-5 text-sm text-neutral-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-750">
        <div className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(99,102,241,0.18),transparent),radial-gradient(50%_70%_at_80%_100%,rgba(14,165,233,0.12),transparent)]"
          />
          <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:py-32">
            <h2 className="mx-auto max-w-2xl text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight tracking-tight">
              Ready to run a smarter rental business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-400">
              Create your workspace, customize your storefront, and take your first booking today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-brand-600"
                to="/signup"
              >
                Create tenant workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-750 px-6 py-3 font-semibold text-neutral-100 transition hover:bg-neutral-800"
                to="/login"
              >
                Open dashboard
              </Link>
            </div>
            <p className="mt-6 text-xs text-neutral-500">No credit card · Launch in minutes · Your own subdomain</p>
          </div>
        </div>
      </section>
    </div>
  );
}
