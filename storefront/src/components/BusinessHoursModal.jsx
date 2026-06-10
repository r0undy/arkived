import { useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { listBusinessHours } from '../lib/businessHours';

/**
 * Accessible opening-hours modal. Triggered from the storefront navigation so
 * hours are one tap away instead of buried in the footer.
 */
export default function BusinessHoursModal({ open, onClose, hours, openState }) {
  useEffect(() => {
    if (!open) return undefined;
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
  }, [open, onClose]);

  if (!open) return null;

  const rows = listBusinessHours(hours);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Opening hours"
    >
      <div
        className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              <Clock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Opening hours</h2>
              <span
                className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold ${
                  openState.isOpen ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${openState.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
                {openState.isOpen ? 'Open now' : 'Closed now'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="mt-5 divide-y divide-slate-100 text-sm">
          {rows.map((row) => {
            const isToday = row.key === openState.todayKey;
            const closed = row.range === 'Closed';
            return (
              <li
                key={row.key}
                className={`flex items-center justify-between py-2.5 ${isToday ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
              >
                <span className="flex items-center gap-2">
                  {row.label}
                  {isToday ? (
                    <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Today
                    </span>
                  ) : null}
                </span>
                <span className={`tabular-nums ${closed ? 'text-slate-400' : ''}`}>{row.range}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
