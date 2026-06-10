import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import ProgressRing from './ui/ProgressRing';
import { api } from '../lib/api';
import { ACTIVATION_STEPS, activationSummary } from '../lib/onboarding';

/**
 * Floating activation launcher (Frontend Roadmap F1.2).
 *
 * A persistent, fixed launcher pinned bottom-right across every dashboard page
 * (complementing the docked widget on the home page). Shows a ProgressRing with
 * core-activation % and opens a popover with the remaining steps. Disappears the
 * moment core activation reaches 100%.
 */
export default function ActivationLauncher() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [tenantRes, equipmentRes, staffRes] = await Promise.all([
          api.tenant().catch(() => null),
          api.equipment({ limit: 1 }).catch(() => null),
          api.staff().catch(() => null)
        ]);
        if (!mounted) return;
        setData({
          tenant: tenantRes?.tenant || null,
          equipmentCount: equipmentRes?.pagination?.total ?? equipmentRes?.data?.length ?? 0,
          staffCount: staffRes?.data?.length ?? 0
        });
      } catch {
        if (mounted) setData(null);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!data?.tenant) return null;

  const summary = activationSummary(data.tenant, {
    equipmentCount: data.equipmentCount,
    staffCount: data.staffCount
  });

  if (summary.coreComplete) return null;

  return (
    <div ref={popoverRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-neutral-750 bg-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-750 bg-neutral-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-brand-400" />
              <p className="text-sm font-semibold text-neutral-100">Finish setting up</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto p-2">
            {ACTIVATION_STEPS.map((step) => {
              const done = summary.completedSet.has(step.id);
              const isNext = summary.nextStep?.id === step.id;
              return (
                <li key={step.id}>
                  <Link
                    to={step.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                      isNext ? 'bg-brand-500/10' : 'hover:bg-neutral-800'
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
                      <span className={`block text-sm ${done ? 'text-neutral-500 line-through' : 'text-neutral-100'}`}>
                        {step.label}
                        {step.optional ? <span className="ml-1 text-xs text-neutral-500">(optional)</span> : null}
                      </span>
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
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-brand-500/40 bg-neutral-900 py-1.5 pl-1.5 pr-4 shadow-2xl transition hover:-translate-y-px hover:border-brand-500"
        aria-label={`Finish setup — ${summary.percent}% complete`}
        aria-expanded={open}
      >
        <ProgressRing value={summary.percent} size={40} stroke={5} />
        <span className="text-sm font-semibold text-neutral-100">Finish setup</span>
      </button>
    </div>
  );
}
