import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Ticket, X } from 'lucide-react';

/**
 * Bottom-right toast shown after a storefront booking inquiry succeeds. It gives
 * the visitor a clear window to copy their booking reference (used to track the
 * request later) before auto-dismissing. The progress bar visualises the
 * remaining time and pauses while the pointer is over the toast.
 */
export default function BookingTrackingToast({ reference, email, onClose, duration = 15000 }) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => (paused ? prev : Math.max(0, prev - 100)));
    }, 100);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (remaining <= 0) onClose();
  }, [remaining, onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the reference is still selectable below.
    }
  };

  const percent = Math.max(0, Math.min(100, (remaining / duration) * 100));
  const trackHref = `/track?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(email || '')}`;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[min(92vw,23rem)] animate-[fadeInUp_0.25s_ease-out] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Save your booking reference</p>
            <p className="mt-0.5 text-xs text-slate-500">Copy this to track your request anytime.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <code className="min-w-0 flex-1 select-all break-all font-mono text-xs text-slate-700">{reference}</code>
          <button
            type="button"
            onClick={copy}
            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <Link
          to={trackHref}
          onClick={onClose}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Track this request
        </Link>
      </div>

      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{ width: `${percent}%`, backgroundColor: 'var(--color-primary)' }}
        />
      </div>
    </div>
  );
}
