import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, CheckCircle2, AlertTriangle, ImageOff } from 'lucide-react';
import { storefrontApi } from '../lib/api';
import Meta from '../components/Meta';
import { useQuoteCart } from '../hooks/useQuoteCart';

const DAY_MS = 24 * 60 * 60 * 1000;
const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString()}`;
const refOf = (id) => (id ? String(id).slice(0, 8).toUpperCase() : '');

/**
 * Multi-item "Request a quote" page (Frontend Roadmap F5.6).
 * Customers collect several items, choose a single date range, and submit one
 * combined inquiry. Backend stays untouched: one inquiry is sent per item and
 * results are aggregated client-side.
 */
export default function QuotePage({ tenant }) {
  const { items, remove, clear } = useQuoteCart(tenant?.slug);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    start_date: '',
    end_date: '',
    message: ''
  });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [results, setResults] = useState(null);

  const updateField = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const days = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const value = Math.round((end - start) / DAY_MS) + 1;
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [form.start_date, form.end_date]);

  const dailyTotal = useMemo(
    () => items.reduce((sum, entry) => sum + Number(entry.daily_rate || 0), 0),
    [items]
  );
  const estimate = days > 0 ? days * dailyTotal : 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!items.length) return;
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setStatus({ loading: false, error: 'The end date must be on or after the start date.' });
      return;
    }
    setStatus({ loading: true, error: '' });
    setResults(null);

    const settled = await Promise.allSettled(
      items.map((entry) =>
        storefrontApi.inquiry({
          tenant_slug: tenant.slug,
          equipment_id: entry.id,
          start_date: form.start_date,
          end_date: form.end_date,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          message: form.message || null
        })
      )
    );

    const summary = settled.map((outcome, index) => {
      const entry = items[index];
      if (outcome.status === 'fulfilled') {
        return { entry, ok: true, reference: outcome.value?.data?.id || '' };
      }
      const err = outcome.reason || {};
      const isConflict = err.status === 409 || err.code === 'BOOKING_CONFLICT';
      return {
        entry,
        ok: false,
        conflict: isConflict,
        message: isConflict
          ? 'Those dates are unavailable for this item.'
          : (err.message || 'Could not submit this item.')
      };
    });

    // Drop successfully-submitted items; keep failures so the customer can retry.
    summary.filter((row) => row.ok).forEach((row) => remove(row.entry.id));

    setStatus({ loading: false, error: '' });
    setResults({
      rows: summary,
      okCount: summary.filter((row) => row.ok).length,
      trackId: summary.find((row) => row.ok)?.reference || '',
      email: form.email
    });
  };

  return (
    <>
      <Meta
        tenant={tenant}
        title={`Request a quote | ${tenant?.name || 'Catalog'}`}
        description={`Build a multi-item rental quote from ${tenant?.name || 'the shop'} and send a single inquiry.`}
        path="/quote"
      />

      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Request a quote</h1>
            <p className="text-sm text-slate-500">Add several items, pick one date range, and send a single inquiry.</p>
          </div>
        </header>

        {results ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6" role="status">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold">
                {results.okCount > 0
                  ? `${results.okCount} ${results.okCount === 1 ? 'request' : 'requests'} sent to ${tenant?.name || 'the shop'}`
                  : 'We could not submit your request'}
              </h2>
            </div>
            <ul className="mt-4 space-y-2">
              {results.rows.map((row) => (
                <li key={row.entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{row.entry.name}</span>
                  {row.ok ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      #{refOf(row.reference)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-700">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      {row.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              {results.trackId ? (
                <Link
                  to={`/track?ref=${encodeURIComponent(results.trackId)}&email=${encodeURIComponent(results.email)}`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  Track your request
                </Link>
              ) : null}
              <Link to="/catalog" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Back to catalog
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-slate-800">Your quote is empty</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Browse the catalog and tap “Add to quote” on the items you’re interested in.</p>
            <Link
              to="/catalog"
              className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{items.length} {items.length === 1 ? 'item' : 'items'}</h2>
                <button type="button" onClick={clear} className="text-sm font-medium text-slate-500 hover:text-rose-600">Clear all</button>
              </div>
              <ul className="space-y-3">
                {items.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {entry.image ? (
                        <img src={entry.image} alt={entry.name} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageOff className="h-6 w-6" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/catalog/${entry.id}`} className="block truncate font-semibold text-slate-900 hover:underline">{entry.name}</Link>
                      <p className="text-sm text-slate-500">{formatMoney(entry.daily_rate)} / day</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      aria-label={`Remove ${entry.name} from quote`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <form onSubmit={submit} className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold">Your details</h2>

              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Full name</span>
                  <input required value={form.name} onChange={updateField('name')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Email</span>
                  <input required type="email" value={form.email} onChange={updateField('email')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Phone</span>
                  <input value={form.phone} onChange={updateField('phone')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Start date</span>
                  <input required type="date" value={form.start_date} onChange={updateField('start_date')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">End date</span>
                  <input required type="date" value={form.end_date} onChange={updateField('end_date')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="col-span-2 block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Message (optional)</span>
                  <textarea rows={3} value={form.message} onChange={updateField('message')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>

              {days > 0 ? (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>{items.length} items × {days} {days === 1 ? 'day' : 'days'}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{formatMoney(estimate)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Estimate excludes deposits; the shop confirms final pricing.</p>
                </div>
              ) : null}

              {status.error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{status.error}</p>
              ) : null}

              <button
                type="submit"
                disabled={status.loading}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
              >
                {status.loading ? 'Sending…' : `Send quote request (${items.length})`}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
