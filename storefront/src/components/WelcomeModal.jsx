import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { HOW_IT_WORKS, REASONS } from '../lib/homeHighlights';

const storageKey = (slug) => `arkived_welcome_seen_${slug || 'shop'}`;

/**
 * Whether the first-visit welcome modal should be shown for this tenant. Gated
 * per-tenant in sessionStorage so it greets a visitor once per browsing session
 * without nagging on every page view.
 */
export function shouldShowWelcome(slug) {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(storageKey(slug)) !== '1';
  } catch {
    return false;
  }
}

export function markWelcomeSeen(slug) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey(slug), '1');
  } catch {
    // Storage may be unavailable (private mode); failing silently is fine.
  }
}

/**
 * First-visit welcome modal — surfaces "how it works" and "why choose us" the
 * moment a visitor lands, then funnels them into the catalog.
 */
export default function WelcomeModal({ tenant, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div
        className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg animate-[scaleIn_180ms_ease-out] rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="rounded-t-3xl px-6 pb-5 pt-7 text-center sm:px-8" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)' }}>
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt="" className="mx-auto mb-3 h-12 w-12 rounded-xl object-contain" />
          ) : (
            <span
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {(tenant.name || 'S').charAt(0).toUpperCase()}
            </span>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-primary)' }}>
            Welcome to
          </p>
          <h2 id="welcome-modal-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {tenant.name}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            {tenant.tagline || 'Renting equipment here is quick and simple. Here’s how it works.'}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {/* How it works */}
          <ol className="space-y-3">
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Why choose */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Why customers choose {tenant.name}
            </p>
            <ul className="mt-3 grid gap-2">
              {REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <li key={reason.title} className="flex items-start gap-2.5 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-900">{reason.title}.</span> {reason.body}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <Link
            to="/catalog"
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Browse the catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {/* Multi-tenant note */}
          <p className="mt-4 text-center text-xs text-slate-400">
            {tenant.name} is an independent shop on{' '}
            <a href="https://arkived.dev" target="_blank" rel="noreferrer" className="font-semibold text-slate-500 hover:text-slate-700">
              Arkived
            </a>{' '}
            — the platform powering thousands of rental businesses.
          </p>
        </div>
      </div>
    </div>
  );
}
