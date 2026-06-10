import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Rocket, Sparkles } from 'lucide-react';
import ProgressRing from './ui/ProgressRing';
import { ACTIVATION_STEPS, activationSummary } from '../lib/onboarding';

/**
 * Persistent activation checklist (Frontend Roadmap F1.2).
 *
 * Stays docked on the dashboard until core activation hits 100%, then collapses
 * into a subtle "Setup complete" state. The next incomplete step is visually the
 * loudest thing — gently pulsing — so the user can't miss it.
 */
export default function ActivationWidget({ tenant, equipmentCount = 0, staffCount = 0, syncing = false }) {
  const summary = activationSummary(tenant, { equipmentCount, staffCount });

  if (summary.coreComplete) {
    return (
      <section className="mt-6 flex items-center gap-3 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-success-500" />
        <div>
          <p className="text-sm font-semibold text-neutral-100">Setup complete</p>
          <p className="text-xs text-neutral-400">Your storefront is live and ready to take bookings.</p>
        </div>
        <Link
          to="/dashboard/settings/branding"
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-success-500 hover:underline"
        >
          Refine branding <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-brand-500/30 bg-linear-to-br from-neutral-800 to-neutral-900 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ProgressRing value={summary.percent} size={64} stroke={7} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Rocket aria-hidden="true" className="h-4 w-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Finish setting up your shop</h2>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            {summary.coreDone} of {summary.coreTotal} essentials done{syncing ? ' • saving…' : ''}.{' '}
            {summary.nextStep ? `Next: ${summary.nextStep.label}.` : ''}
          </p>
        </div>
        {summary.nextStep ? (
          <Link
            to={summary.nextStep.href}
            className="inline-flex animate-pulse items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-brand-600"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {summary.nextStep.label}
          </Link>
        ) : null}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {ACTIVATION_STEPS.map((step) => {
          const done = summary.completedSet.has(step.id);
          const isNext = summary.nextStep?.id === step.id;
          return (
            <li key={step.id}>
              <Link
                to={step.href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                  done
                    ? 'border-neutral-750 bg-neutral-900/60'
                    : isNext
                      ? 'border-brand-500/50 bg-brand-500/10'
                      : 'border-neutral-750 bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    done ? 'border-success-500 bg-success-500 text-white' : 'border-neutral-600 text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${done ? 'text-neutral-400 line-through' : 'text-neutral-100'}`}>
                    {step.label}
                    {step.optional ? <span className="ml-1 text-xs text-neutral-500">(optional)</span> : null}
                  </span>
                  {!done ? <span className="block text-xs text-neutral-500">{step.hint}</span> : null}
                </span>
                {!done ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 group-hover:text-neutral-300"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
