import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Link2, Check, X } from 'lucide-react';
import { storefrontApi } from '../lib/api';
import Meta from '../components/Meta';
import { ProductJsonLd } from '../components/StructuredData';
import { recordRecentlyViewed, getRecentlyViewed } from '../lib/recentlyViewed';

const DAY_MS = 24 * 60 * 60 * 1000;
const toYmd = (value) => new Date(value).toISOString().slice(0, 10);
const addDays = (value, days) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

export default function EquipmentDetailPage({ item, tenant, equipment = [] }) {
  const title = item ? `${item.name} | ${tenant?.name || 'Catalog'}` : 'Equipment not found';
  const description = item
    ? `View pricing, availability, and booking inquiry form for ${item.name}.`
    : 'The selected equipment could not be found.';

  if (!item) {
    return (
      <>
        <Meta tenant={tenant} title={title} description={description} path="/catalog" />

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-slate-600">Equipment not found.</p>
        </div>
      </>
    );
  }

  const [activeImage, setActiveImage] = useState(item.images?.[0]?.storage_url || '');
  const [availability, setAvailability] = useState([]);
  const [availabilityError, setAvailabilityError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    start_date: '',
    end_date: '',
    message: ''
  });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setActiveImage(item.images?.[0]?.storage_url || '');
  }, [item.id, item.images]);

  useEffect(() => {
    recordRecentlyViewed(tenant?.slug, item);
    setRecent(getRecentlyViewed(tenant?.slug, item.id).slice(0, 4));
  }, [tenant?.slug, item.id, item]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!tenant?.slug) return;
      const start = toYmd(new Date());
      const end = toYmd(addDays(new Date(), 90));
      try {
        const result = await storefrontApi.equipmentAvailability(tenant.slug, item.id, { start, end });
        setAvailability(result.data || []);
        setAvailabilityError('');
      } catch (_error) {
        setAvailability([]);
        setAvailabilityError('Failed to load availability. Please refresh this page.');
      }
    };
    run();
  }, [tenant?.slug, item.id]);

  const related = useMemo(
    () => equipment.filter((entry) => entry.id !== item.id && entry.category === item.category).slice(0, 4),
    [equipment, item.id, item.category]
  );

  const unavailableRanges = useMemo(
    () => availability.filter((entry) => ['reserved', 'payment', 'dispatched', 'returned', 'inspected'].includes(entry.status)),
    [availability]
  );

  const estimate = useMemo(() => {
    if (!form.start_date || !form.end_date) return null;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.round((end - start) / DAY_MS) + 1;
    if (!Number.isFinite(days) || days <= 0) return null;
    const deposit = Number(item.deposit || 0);
    return { days, deposit, total: days * Number(item.daily_rate || 0) + deposit };
  }, [form.start_date, form.end_date, item.daily_rate, item.deposit]);

  const updateField = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitInquiry = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const result = await storefrontApi.inquiry({
        tenant_slug: tenant.slug,
        equipment_id: item.id,
        start_date: form.start_date,
        end_date: form.end_date,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null
      });
      const reference = result?.data?.id ? String(result.data.id).slice(0, 8).toUpperCase() : '';
      setStatus({
        loading: false,
        error: '',
        success: reference
          ? `Request received! ${tenant?.name || 'The shop'} has your inquiry. Your reference is #${reference}.`
          : `Request received! ${tenant?.name || 'The shop'} will get back to you shortly.`,
        trackRef: result?.data?.id || '',
        trackEmail: form.email
      });
      setForm({
        name: '',
        email: '',
        phone: '',
        start_date: '',
        end_date: '',
        message: ''
      });
    } catch (error) {
      const isConflict = error?.status === 409 || error?.code === 'BOOKING_CONFLICT';
      setStatus({
        loading: false,
        error: isConflict
          ? 'Those dates were just taken. Please pick a different range — availability has been refreshed below.'
          : (error.message || 'Failed to submit inquiry'),
        success: ''
      });
    }
  };

  return (
    <>
      <Meta tenant={tenant} title={title} description={description} path={item?.id ? `/catalog/${item.id}` : '/catalog'} image={item?.images?.[0]?.storage_url} />
      <ProductJsonLd tenant={tenant} item={item} />

      <div className="space-y-6 pb-20 md:pb-0">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">{item.category}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{item.name}</h1>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Copy link to this item"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>

          {(item.images?.length || 0) > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block w-full cursor-zoom-in"
                aria-label="View larger image"
              >
                <img
                  alt={item.name}
                  className="h-64 w-full rounded-lg border border-slate-200 object-cover"
                  loading="eager"
                  src={activeImage || item.images[0].storage_url}
                />
              </button>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.images.map((image) => (
                  <button key={image.id} onClick={() => setActiveImage(image.storage_url)} type="button">
                    <img
                      alt={`${item.name} thumbnail`}
                      className={`h-14 w-20 rounded border object-cover ${activeImage === image.storage_url ? 'border-slate-900' : 'border-slate-200'}`}
                      loading="lazy"
                      src={image.storage_url}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-4 max-w-3xl text-slate-700">{item.description || 'No description yet.'}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Stat label="Daily rate" value={`PHP ${Number(item.daily_rate).toLocaleString()}`} />
            <Stat label="Deposit" value={`PHP ${Number(item.deposit || 0).toLocaleString()}`} />
            <Stat label="Condition" value={item.condition || 'good'} />
            <Stat label="Status" value={item.status || 'available'} />
          </div>
        </article>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold tracking-tight">Availability (Read-only)</h2>
          <div className="mt-3 grid gap-2">
            {availabilityError ? <p className="text-sm text-red-700">{availabilityError}</p> : null}
            {unavailableRanges.map((entry) => (
              <p key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Unavailable: {entry.start_date} to {entry.end_date} ({entry.status})
              </p>
            ))}
            {unavailableRanges.length === 0 && !availabilityError ? <p className="text-sm text-slate-600">No blocked dates in the next 90 days.</p> : null}
          </div>
        </section>

        <section id="inquiry" className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold tracking-tight">Inquiry / Booking Request</h2>
          {item.status === 'maintenance' || item.status === 'archived' ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This item is currently unavailable for booking. You can still send an inquiry and we'll follow up when it's back.
            </div>
          ) : null}
          {status.success ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-3 font-semibold text-emerald-800">{status.success}</p>
              <p className="mt-1 text-sm text-emerald-700">We'll reach out by email to confirm availability and next steps.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {status.trackRef ? (
                  <Link
                    to={`/track?ref=${encodeURIComponent(status.trackRef)}&email=${encodeURIComponent(status.trackEmail || '')}`}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  >
                    Track your request
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  onClick={() => setStatus({ loading: false, error: '', success: '' })}
                >
                  Send another request
                </button>
              </div>
            </div>
          ) : (
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submitInquiry}>
              <Field label="Name" onChange={updateField('name')} required value={form.name} />
              <Field label="Email" onChange={updateField('email')} required type="email" value={form.email} />
              <Field label="Phone" onChange={updateField('phone')} value={form.phone} />
              <Field label="Start Date" min={toYmd(new Date())} onChange={updateField('start_date')} required type="date" value={form.start_date} />
              <Field label="End Date" min={form.start_date || toYmd(new Date())} onChange={updateField('end_date')} required type="date" value={form.end_date} />
              <label className="block text-sm text-slate-700 md:col-span-2">
                <span>Message</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                  onChange={updateField('message')}
                  rows={3}
                  value={form.message}
                />
              </label>

              {estimate ? (
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Estimated total: <span className="font-semibold">PHP {estimate.total.toLocaleString()}</span>{' '}
                  <span className="text-slate-500">({estimate.days} day{estimate.days === 1 ? '' : 's'} × PHP {Number(item.daily_rate).toLocaleString()}{estimate.deposit ? ` + PHP ${estimate.deposit.toLocaleString()} deposit` : ''})</span>
                </div>
              ) : null}

              {status.error ? <p role="alert" className="text-sm text-rose-600 md:col-span-2">{status.error}</p> : null}

              <button
                className="inline-flex w-fit items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition hover:brightness-95 disabled:opacity-60"
                disabled={status.loading}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                type="submit"
              >
                {status.loading ? 'Submitting…' : 'Submit inquiry'}
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold tracking-tight">Related Equipment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((entry) => (
              <Link key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100" to={`/catalog/${entry.id}`}>
                <p className="text-xs uppercase tracking-wide text-slate-500">{entry.category}</p>
                <p className="mt-1 font-semibold">{entry.name}</p>
                <p className="mt-1 text-sm text-slate-600">PHP {Number(entry.daily_rate || 0).toLocaleString()} / day</p>
              </Link>
            ))}
            {related.length === 0 ? <p className="text-sm text-slate-600">No related items available.</p> : null}
          </div>
        </section>

        {recent.length > 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold tracking-tight">Recently viewed</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((entry) => (
                <Link key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100" to={`/catalog/${entry.id}`}>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{entry.category}</p>
                  <p className="mt-1 font-semibold">{entry.name}</p>
                  <p className="mt-1 text-sm text-slate-600">PHP {Number(entry.daily_rate || 0).toLocaleString()} / day</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Sticky mobile inquiry CTA (F5.6) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">From</p>
            <p className="text-base font-bold text-slate-900">PHP {Number(item.daily_rate).toLocaleString()}<span className="text-xs font-normal text-slate-500">/day</span></p>
          </div>
          <a
            href="#inquiry"
            className="inline-flex flex-1 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Request a quote
          </a>
        </div>
      </div>

      {/* Lightbox (F4.2 / F5.3) */}
      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.name} image`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <img
            alt={item.name}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            src={activeImage || item.images?.[0]?.storage_url}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm text-slate-700">
      <span>{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
        {...props}
      />
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}
