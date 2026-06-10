import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  Palette,
  Globe,
  ShieldCheck,
  BarChart3,
  Users,
  Sparkles,
  Check,
  ImageIcon
} from 'lucide-react';
import YouTubeEmbed from '../components/marketing/YouTubeEmbed';
import TeamCarousel from '../components/marketing/TeamCarousel';
import Marquee from '../components/marketing/Marquee';
import { api } from '../lib/api';

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
  { name: 'Donna Reymatias', role: 'Team Member', tone: 'bg-linear-to-br from-info-500 to-brand-600' },
  { name: 'Emmanuel Oaing', role: 'Team Member', tone: 'bg-linear-to-br from-success-500 to-info-500' },
  { name: 'Kerby Correa', role: 'Team Member', tone: 'bg-linear-to-br from-warning-500 to-danger-500' },
  { name: 'Nicholas Jose', role: 'Team Member', tone: 'bg-linear-to-br from-danger-500 to-brand-500' },
  { name: 'Samantha Paquibot', role: 'Team Member', tone: 'bg-linear-to-br from-brand-600 to-success-500' },
  { name: 'Akisha Lei de Castro', role: 'Team Member', tone: 'bg-linear-to-br from-info-500 to-success-500' }
];

function PartnerLink({ partner }) {
  return (
    <a
      href={storefrontUrlFor(partner.slug)}
      target="_blank"
      rel="noreferrer"
      title={`Visit ${partner.name}`}
      className="group inline-flex shrink-0 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-5 py-3 transition hover:-translate-y-0.5 hover:border-neutral-700 hover:bg-neutral-800"
    >
      {partner.logo_url ? (
        <img
          src={partner.logo_url}
          alt=""
          loading="lazy"
          className="h-8 w-8 shrink-0 rounded-md object-contain opacity-80 transition group-hover:opacity-100"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ backgroundColor: partner.accent_color || '#6366f1' }}
        >
          {initialsOf(partner.name)}
        </span>
      )}
      <span className="whitespace-nowrap text-lg font-bold tracking-tight text-neutral-500 transition-colors group-hover:text-neutral-200">
        {partner.name}
      </span>
    </a>
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              The operating system for rental shops
            </span>
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

          <div className="relative lg:justify-self-end">
            <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-4xl bg-brand-500/10 blur-3xl" />
            {/* Placeholder for a hero model photo — swap the inner content for an <img> */}
            <div className="motion-safe:animate-[floatY_6s_ease-in-out_infinite]">
              <div className="relative mx-auto aspect-4/5 w-full max-w-sm overflow-hidden rounded-4xl border border-neutral-750 bg-linear-to-br from-neutral-800 to-neutral-900">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.4] bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-size-[28px_28px]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800/80 text-neutral-500 ring-1 ring-neutral-750">
                    <ImageIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium text-neutral-400">Hero image goes here</p>
                  <p className="max-w-[22ch] text-xs text-neutral-600">Drop in your model / product shot</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner marquee */}
        {partners.length > 0 ? (
          <div className="border-t border-neutral-750 bg-neutral-950/40 py-8">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Trusted by rental shops everywhere
            </p>
            <Marquee duration={32} className="mask-[linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
              {partners.map((partner) => (
                <PartnerLink key={partner.slug} partner={partner} />
              ))}
            </Marquee>
          </div>
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

      {/* Demo */}
      <section id="demo" className="scroll-mt-24 border-y border-neutral-750 bg-neutral-950/40">
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
                <span className="absolute left-[-2.55rem] flex h-8 w-8 items-center justify-center rounded-full border border-brand-500/40 bg-neutral-900 text-sm font-bold text-brand-300">
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

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden border-t border-neutral-750">
        {/* Animated aurora wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_20%_20%,rgba(99,102,241,0.28),transparent),radial-gradient(45%_55%_at_85%_30%,rgba(14,165,233,0.22),transparent),radial-gradient(60%_60%_at_50%_100%,rgba(99,102,241,0.18),transparent)] bg-size-[160%_160%] motion-safe:animate-[auroraShift_16s_ease-in-out_infinite]"
        />
        {/* Grid texture, faded toward edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
        />
        {/* Floating glow orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-10 -z-10 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl motion-safe:animate-[floatY_7s_ease-in-out_infinite]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-6 -z-10 h-64 w-64 rounded-full bg-info-500/20 blur-3xl motion-safe:animate-[floatY_9s_ease-in-out_infinite]" />

        <div className="mx-auto max-w-3xl px-6 py-24 text-center lg:py-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Launch in minutes
          </span>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight">
            Ready to run a{' '}
            <span className="bg-linear-to-r from-brand-400 via-info-400 to-brand-300 bg-clip-text text-transparent">
              smarter rental business?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-300">
            Create your workspace, customize your storefront, and take your first booking today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-semibold shadow-[0_8px_30px_rgba(99,102,241,0.35)] transition hover:-translate-y-0.5 hover:bg-brand-600"
              to="/signup"
            >
              Create tenant workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/50 px-6 py-3 font-semibold text-neutral-100 backdrop-blur transition hover:bg-neutral-800"
              to="/login"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
