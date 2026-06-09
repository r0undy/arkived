import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { storefrontApi } from '../lib/api';

const DAY_MS = 24 * 60 * 60 * 1000;
const toYmd = (value) => new Date(value).toISOString().slice(0, 10);
const addDays = (value, days) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

export default function EquipmentDetailPage({ item, tenant, equipment = [] }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = item?.id ? `${origin}/catalog/${item.id}` : `${origin}/catalog`;
  const title = item ? `${item.name} | ${tenant?.name || 'Catalog'}` : 'Equipment not found';
  const description = item
    ? `View pricing, availability, and booking inquiry form for ${item.name}.`
    : 'The selected equipment could not be found.';

  if (!item) {
    return (
      <>
        <title>{title}</title>
        <meta content={description} name="description" />
        <link href={canonicalUrl} rel="canonical" />

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

  useEffect(() => {
    setActiveImage(item.images?.[0]?.storage_url || '');
  }, [item.id, item.images]);

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

  const updateField = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitInquiry = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      await storefrontApi.inquiry({
        tenant_slug: tenant.slug,
        equipment_id: item.id,
        start_date: form.start_date,
        end_date: form.end_date,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null
      });
      setStatus({ loading: false, error: '', success: 'Inquiry submitted. We will contact you soon.' });
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
          ? 'Selected dates are no longer available. Please choose a different date range.'
          : (error.message || 'Failed to submit inquiry'),
        success: ''
      });
    }
  };

  return (
    <>
      <title>{title}</title>
      <meta content={description} name="description" />
      <link href={canonicalUrl} rel="canonical" />

      <div className="space-y-6">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm uppercase tracking-wide text-slate-500">{item.category}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{item.name}</h1>

          {(item.images?.length || 0) > 0 ? (
            <div className="mt-4">
              <img
                alt={item.name}
                className="h-64 w-full rounded-lg border border-slate-200 object-cover"
                loading="eager"
                src={activeImage || item.images[0].storage_url}
              />
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

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold tracking-tight">Inquiry / Booking Request</h2>
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

            {status.error ? <p className="text-sm text-red-600 md:col-span-2">{status.error}</p> : null}
            {status.success ? <p className="text-sm text-emerald-700 md:col-span-2">{status.success}</p> : null}

            <button
              className="w-fit rounded-md px-4 py-2 text-sm font-semibold"
              disabled={status.loading}
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
              type="submit"
            >
              {status.loading ? 'Submitting...' : 'Submit inquiry'}
            </button>
          </form>
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
      </div>
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
