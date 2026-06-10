import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, Circle, PackageCheck, Loader2 } from 'lucide-react';
import Meta from '../components/Meta';
import { storefrontApi } from '../lib/api';

// Customer-facing pipeline derived from the internal booking status
// (reserved → payment → dispatched → returned → inspected → closed).
const STAGES = [
  { key: 'received', label: 'Received', body: 'Your request is in.' },
  { key: 'confirmed', label: 'Confirmed', body: 'Dates and payment confirmed.' },
  { key: 'ready', label: 'Ready / Picked up', body: 'Your gear is on its way to you.' },
  { key: 'returned', label: 'Returned', body: 'Gear returned and being checked.' },
  { key: 'completed', label: 'Completed', body: 'All done — thanks for renting!' }
];

const STATUS_TO_STAGE = {
  reserved: 0,
  payment: 1,
  dispatched: 2,
  returned: 3,
  inspected: 3,
  closed: 4
};

const formatDate = (value) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function TrackRequestPage({ tenant }) {
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState(searchParams.get('ref') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [result, setResult] = useState(null);

  const lookup = async (ref, mail) => {
    if (!ref || !mail) return;
    setStatus({ loading: true, error: '' });
    setResult(null);
    try {
      const response = await storefrontApi.track(tenant.slug, { reference: ref, email: mail });
      setResult(response.data || null);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setResult(null);
      setStatus({
        loading: false,
        error: error?.message || 'We couldn’t find that request. Double-check your reference and email.'
      });
    }
  };

  // Auto-lookup when arriving from the inquiry success link (?ref=&email=).
  useEffect(() => {
    const ref = searchParams.get('ref');
    const mail = searchParams.get('email');
    if (ref && mail) lookup(ref, mail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    lookup(reference.trim(), email.trim());
  };

  const currentStage = result ? (STATUS_TO_STAGE[result.status] ?? 0) : -1;

  return (
    <>
      <Meta tenant={tenant} title={`Track your request | ${tenant.name}`} description={`Check the status of your rental request with ${tenant.name}.`} path="/track" />

      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Track your request</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your booking reference and the email you used to see where your rental is in the process.
        </p>

        <form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Booking reference</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="e.g. 1a2b3c4d-…"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <button
            type="submit"
            disabled={status.loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            {status.loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            Track
          </button>
        </form>

        {status.error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{status.error}</p>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                <PackageCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{result.equipment_name || 'Your rental'}</p>
                <p className="text-sm text-slate-500">
                  {formatDate(result.start_date)} – {formatDate(result.end_date)} · Ref #{String(result.reference).slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <ol className="mt-6 space-y-4">
              {STAGES.map((stage, index) => {
                const done = index < currentStage;
                const active = index === currentStage;
                return (
                  <li key={stage.key} className="flex items-start gap-3">
                    <span className="mt-0.5">
                      {done || active ? (
                        <CheckCircle2
                          className="h-5 w-5"
                          style={{ color: 'var(--color-primary)' }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                        {stage.label}
                        {active ? <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">Current</span> : null}
                      </p>
                      <p className={`text-xs ${active ? 'text-slate-600' : 'text-slate-400'}`}>{stage.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </div>
    </>
  );
}
