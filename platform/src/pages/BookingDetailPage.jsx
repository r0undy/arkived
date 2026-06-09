import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

const STAGES = ['reserved', 'payment', 'dispatched', 'returned', 'inspected', 'closed'];
const NEXT_STATUS = {
  reserved: 'payment',
  payment: 'dispatched',
  dispatched: 'returned',
  returned: 'inspected',
  inspected: 'closed'
};
const ACTION_LABEL = {
  payment: 'Confirm Payment',
  dispatched: 'Mark Dispatched',
  returned: 'Mark Returned',
  inspected: 'Complete Inspection',
  closed: 'Close Booking'
};

export default function BookingDetailPage() {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [equipmentMap, setEquipmentMap] = useState({});
  const [customerMap, setCustomerMap] = useState({});
  const [form, setForm] = useState({
    dispatch_condition: '',
    return_condition: '',
    payment_reference: ''
  });
  const [status, setStatus] = useState({ loading: false, error: '', message: '' });

  const load = async () => {
    if (!id) return;
    try {
      const [bookingResult, equipmentResult, customersResult] = await Promise.all([
        api.bookingById(id),
        api.equipment(),
        api.customers()
      ]);

      const nextBooking = bookingResult.data || null;
      setBooking(nextBooking);
      setForm({
        dispatch_condition: nextBooking?.dispatch_condition || '',
        return_condition: nextBooking?.return_condition || '',
        payment_reference: nextBooking?.payment_reference || ''
      });

      const equipmentLookup = Object.fromEntries((equipmentResult.data || []).map((item) => [item.id, item]));
      const customerLookup = Object.fromEntries((customersResult.data || []).map((item) => [item.id, item]));
      setEquipmentMap(equipmentLookup);
      setCustomerMap(customerLookup);
    } catch (_error) {
      setBooking(null);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const nextStatus = booking ? NEXT_STATUS[booking.status] : '';

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const saveMutableFields = async (event) => {
    event.preventDefault();
    if (!booking) return;

    setStatus({ loading: true, error: '', message: '' });
    try {
      const result = await api.updateBooking(booking.id, {
        dispatch_condition: form.dispatch_condition || null,
        return_condition: form.return_condition || null,
        payment_reference: form.payment_reference || null
      });
      setBooking(result.data || booking);
      setStatus({ loading: false, error: '', message: 'Booking details updated.' });
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Failed to save booking details', message: '' });
    }
  };

  const moveForward = async () => {
    if (!booking || !nextStatus) return;
    setStatus({ loading: true, error: '', message: '' });
    try {
      const result = await api.updateBookingStatus(booking.id, nextStatus);
      setBooking(result.data || booking);
      setStatus({ loading: false, error: '', message: `Moved to ${nextStatus}.` });
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Failed to update booking status', message: '' });
    }
  };

  const stageIndex = booking ? STAGES.indexOf(booking.status) : -1;
  const equipment = booking ? equipmentMap[booking.equipment_id] : null;
  const customer = booking ? customerMap[booking.customer_id] : null;
  const totalAmount = Number(booking?.total_amount || 0);
  const showDispatchCondition = ['dispatched', 'returned', 'inspected', 'closed'].includes(booking?.status || '');
  const showReturnCondition = ['returned', 'inspected', 'closed'].includes(booking?.status || '');

  const summary = useMemo(() => {
    if (!booking) return '';
    return `${booking.start_date} to ${booking.end_date}`;
  }, [booking]);

  return (
    <div>
      <div className="mb-4">
        <Link className="text-sm text-neutral-300 hover:text-brand-400" to="/dashboard/bookings">
          ← Back to bookings
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Booking Detail</h1>
      <p className="mt-2 text-sm text-neutral-400">{summary || 'Loading booking...'}</p>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Status Pipeline</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAGES.map((stage, index) => (
            <span
              key={stage}
              className={`rounded-md border px-3 py-1 text-xs uppercase tracking-wide ${
                index <= stageIndex
                  ? 'border-brand-500 bg-brand-500/20 text-brand-200'
                  : 'border-neutral-700 bg-neutral-900 text-neutral-400'
              }`}
            >
              {stage}
            </span>
          ))}
        </div>

        {nextStatus ? (
          <button
            className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
            disabled={status.loading}
            onClick={moveForward}
            type="button"
          >
            {ACTION_LABEL[nextStatus] || `Move to ${nextStatus}`}
          </button>
        ) : null}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Booking Info</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <Info label="Customer" value={customer?.full_name || booking?.customer_id || '--'} />
          <Info label="Equipment" value={equipment?.name || booking?.equipment_id || '--'} />
          <Info label="Dates" value={summary || '--'} />
          <Info label="Status" value={booking?.status || '--'} />
          <Info label="Total Amount" value={`PHP ${totalAmount.toLocaleString()}`} />
          <Info label="Overdue" value={booking?.overdue ? 'Yes' : 'No'} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Mutable Fields</h2>
        <form className="mt-3 grid gap-3" onSubmit={saveMutableFields}>
          <label className="block text-sm text-neutral-200">
            <span>Payment Reference</span>
            <input
              className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
              onChange={updateField('payment_reference')}
              value={form.payment_reference}
            />
          </label>

          {showDispatchCondition ? (
            <label className="block text-sm text-neutral-200">
              <span>Dispatch Condition</span>
              <textarea
                className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
                onChange={updateField('dispatch_condition')}
                rows={3}
                value={form.dispatch_condition}
              />
            </label>
          ) : null}

          {showReturnCondition ? (
            <label className="block text-sm text-neutral-200">
              <span>Return Condition</span>
              <textarea
                className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
                onChange={updateField('return_condition')}
                rows={3}
                value={form.return_condition}
              />
            </label>
          ) : null}

          {status.error ? <p className="text-sm text-danger-500">{status.error}</p> : null}
          {status.message ? <p className="text-sm text-success-500">{status.message}</p> : null}

          <button
            className="w-fit rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
            disabled={status.loading || !booking}
            type="submit"
          >
            Save Fields
          </button>
        </form>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-neutral-750 bg-neutral-900 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-sm text-neutral-100">{value}</p>
    </div>
  );
}
