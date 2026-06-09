import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const NEXT_STATUS = {
  reserved: 'payment',
  payment: 'dispatched',
  dispatched: 'returned',
  returned: 'inspected',
  inspected: 'closed'
};
const BLOCKING_STATUSES = new Set(['reserved', 'payment', 'dispatched', 'returned', 'inspected']);
const DAY_MS = 24 * 60 * 60 * 1000;
const toYmd = (value) => new Date(value).toISOString().slice(0, 10);
const addDays = (value, days) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};
const overlapsRange = (start, end, ranges) => {
  if (!start || !end) return false;
  return ranges.some((range) => start <= range.end_date && end >= range.start_date);
};

export default function BookingsPage() {
  const [filters, setFilters] = useState({
    status: '',
    start: '',
    end: '',
    equipment_id: '',
    customer_id: '',
    page: 1,
    limit: 10
  });
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0, limit: 10 });
  const [equipment, setEquipment] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState({ loading: false, error: '' });
  const [createForm, setCreateForm] = useState({
    customer_mode: 'existing',
    customer_id: '',
    customer_search: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    equipment_id: '',
    start_date: '',
    end_date: '',
    payment_reference: '',
    deposit_paid: false
  });
  const [availability, setAvailability] = useState(null);
  const [blockedRanges, setBlockedRanges] = useState([]);

  const loadBookings = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );
      const result = await api.bookings(params);
      setBookings(result.data || []);
      setMeta(result.meta || { page: 1, total_pages: 1, total: 0, limit: 10 });
    } catch (_error) {
      setBookings([]);
      setMeta({ page: 1, total_pages: 1, total: 0, limit: 10 });
    }
  };

  const loadLookups = async () => {
    try {
      const [equipmentResult, customersResult] = await Promise.all([
        api.equipment(),
        api.customers()
      ]);
      setEquipment(equipmentResult.data || []);
      setCustomers(customersResult.data || []);
    } catch (_error) {
      setEquipment([]);
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const moveForward = async (booking) => {
    const next = NEXT_STATUS[booking.status];
    if (!next) return;

    try {
      await api.updateBookingStatus(booking.id, next);
      await loadBookings();
    } catch (_error) {
      // No-op: keep current state if request fails.
    }
  };

  const updateFilter = (key) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const equipmentMap = useMemo(
    () => Object.fromEntries(equipment.map((item) => [item.id, item])),
    [equipment]
  );
  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((item) => [item.id, item])),
    [customers]
  );
  const hasOverdue = bookings.some((entry) => entry.overdue);

  const updateCreateField = (key) => (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setCreateForm((prev) => {
      if (key === 'customer_mode' && value === 'new') {
        return { ...prev, customer_mode: value, customer_id: '', customer_search: '' };
      }
      if (key === 'customer_mode' && value === 'existing') {
        return { ...prev, customer_mode: value, customer_name: '', customer_email: '', customer_phone: '' };
      }
      return { ...prev, [key]: value };
    });
  };

  const filteredCustomers = useMemo(() => {
    if (createForm.customer_mode !== 'existing') return customers;
    const query = String(createForm.customer_search || '').trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((entry) => {
      const hay = `${entry.full_name || ''} ${entry.email || ''} ${entry.phone || ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [createForm.customer_mode, createForm.customer_search, customers]);

  useEffect(() => {
    const run = async () => {
      if (!createForm.equipment_id || !createForm.start_date || !createForm.end_date) {
        setAvailability(null);
        return;
      }

      try {
        const result = await api.equipmentAvailability(createForm.equipment_id, {
          from: createForm.start_date,
          to: createForm.end_date
        });
        setAvailability(result.data || null);
      } catch (_error) {
        setAvailability(null);
      }
    };

    run();
  }, [createForm.equipment_id, createForm.start_date, createForm.end_date]);

  useEffect(() => {
    const run = async () => {
      if (!createForm.equipment_id) {
        setBlockedRanges([]);
        return;
      }

      const today = new Date();
      const nextYear = addDays(today, 365);
      try {
        const result = await api.bookingsCalendar({
          equipment_id: createForm.equipment_id,
          start: toYmd(today),
          end: toYmd(nextYear)
        });

        setBlockedRanges(
          (result.data || []).filter((entry) => BLOCKING_STATUSES.has(entry.status))
        );
      } catch (_error) {
        setBlockedRanges([]);
      }
    };

    run();
  }, [createForm.equipment_id]);

  const updateCreateDate = (key) => (event) => {
    const value = event.target.value;
    const next = { ...createForm, [key]: value };

    if (key === 'start_date' && next.end_date && value > next.end_date) {
      next.end_date = value;
    }

    if (next.start_date && next.end_date && overlapsRange(next.start_date, next.end_date, blockedRanges)) {
      setCreateStatus({ loading: false, error: 'Selected date range is unavailable for this equipment.' });
      return;
    }

    setCreateStatus((prev) => ({ ...prev, error: '' }));
    setCreateForm(next);
  };

  const computedTotal = useMemo(() => {
    const item = equipmentMap[createForm.equipment_id];
    if (!item || !createForm.start_date || !createForm.end_date) return 0;
    const start = new Date(createForm.start_date);
    const end = new Date(createForm.end_date);
    const ms = end.getTime() - start.getTime();
    const days = Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)) + 1);
    return Number(item.daily_rate || 0) * days;
  }, [equipmentMap, createForm.equipment_id, createForm.start_date, createForm.end_date]);

  const createBooking = async (event) => {
    event.preventDefault();
    setCreateStatus({ loading: true, error: '' });

    try {
      if (overlapsRange(createForm.start_date, createForm.end_date, blockedRanges)) {
        throw new Error('Selected date range is unavailable for this equipment.');
      }

      let customerId = createForm.customer_id;
      if (createForm.customer_mode === 'new') {
        const customerResult = await api.createCustomer({
          full_name: createForm.customer_name,
          email: createForm.customer_email || null,
          phone: createForm.customer_phone || null
        });
        customerId = customerResult.data?.id || '';
      }

      await api.createBooking({
        equipment_id: createForm.equipment_id,
        customer_id: customerId,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        total_amount: computedTotal,
        deposit_paid: Boolean(createForm.deposit_paid),
        payment_reference: createForm.payment_reference || null
      });

      setShowCreate(false);
      setCreateStatus({ loading: false, error: '' });
      setCreateForm({
        customer_mode: 'existing',
        customer_id: '',
        customer_search: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        equipment_id: '',
        start_date: '',
        end_date: '',
        payment_reference: '',
        deposit_paid: false
      });
      await Promise.all([loadLookups(), loadBookings()]);
    } catch (error) {
      const isConflict = error?.status === 409 || error?.code === 'BOOKING_CONFLICT';
      setCreateStatus({
        loading: false,
        error: isConflict
          ? 'Booking conflict: this equipment is already reserved for the selected dates. Please choose another date range.'
          : (error.message || 'Failed to create booking')
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
      <p className="mt-2 text-sm text-neutral-400">Track reservation-to-return pipeline.</p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect label="Status" value={filters.status} onChange={updateFilter('status')}>
            <option value="">All</option>
            <option value="reserved">reserved</option>
            <option value="payment">payment</option>
            <option value="dispatched">dispatched</option>
            <option value="returned">returned</option>
            <option value="inspected">inspected</option>
            <option value="closed">closed</option>
          </FilterSelect>

          <FilterInput label="Start Date" type="date" value={filters.start} onChange={updateFilter('start')} />
          <FilterInput label="End Date" type="date" value={filters.end} onChange={updateFilter('end')} />

          <FilterSelect label="Equipment" value={filters.equipment_id} onChange={updateFilter('equipment_id')}>
            <option value="">All</option>
            {equipment.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </FilterSelect>

          <FilterSelect label="Customer" value={filters.customer_id} onChange={updateFilter('customer_id')}>
            <option value="">All</option>
            {customers.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
          </FilterSelect>
        </div>

        <button
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600"
          onClick={() => setShowCreate((prev) => !prev)}
          type="button"
        >
          {showCreate ? 'Close Create' : 'Create Booking'}
        </button>
      </div>

      {hasOverdue ? (
        <div className="mt-4 rounded-md border border-warning-500/40 bg-warning-500/10 px-3 py-2 text-sm text-warning-200">
          Overdue alert: one or more bookings in this result are marked overdue.
        </div>
      ) : null}

      {showCreate ? (
        <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
          <h2 className="text-lg font-semibold tracking-tight">Create Booking</h2>
          <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={createBooking}>
            <FilterSelect label="Customer Mode" value={createForm.customer_mode} onChange={updateCreateField('customer_mode')}>
              <option value="existing">Existing customer</option>
              <option value="new">Create new customer</option>
            </FilterSelect>

            {createForm.customer_mode === 'existing' ? (
              <>
                <FilterInput
                  label="Search Customer"
                  onChange={updateCreateField('customer_search')}
                  placeholder="Type name/email/phone"
                  value={createForm.customer_search}
                />
                <FilterSelect label="Customer" value={createForm.customer_id} onChange={updateCreateField('customer_id')} required>
                  <option value="">Select customer</option>
                  {filteredCustomers.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
                </FilterSelect>
              </>
            ) : (
              <>
                <FilterInput label="Customer Name" value={createForm.customer_name} onChange={updateCreateField('customer_name')} required />
                <FilterInput label="Customer Email" type="email" value={createForm.customer_email} onChange={updateCreateField('customer_email')} />
                <FilterInput label="Customer Phone" value={createForm.customer_phone} onChange={updateCreateField('customer_phone')} />
              </>
            )}

            <FilterSelect label="Equipment" value={createForm.equipment_id} onChange={updateCreateField('equipment_id')} required>
              <option value="">Select equipment</option>
              {equipment.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>

            <FilterInput label="Start Date" min={toYmd(new Date())} type="date" value={createForm.start_date} onChange={updateCreateDate('start_date')} required />
            <FilterInput label="End Date" min={createForm.start_date || toYmd(new Date())} type="date" value={createForm.end_date} onChange={updateCreateDate('end_date')} required />
            <FilterInput label="Payment Reference" value={createForm.payment_reference} onChange={updateCreateField('payment_reference')} />

            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input checked={createForm.deposit_paid} onChange={updateCreateField('deposit_paid')} type="checkbox" />
              Deposit paid
            </label>

            <div className="text-sm text-neutral-300">
              Estimated total amount: <span className="font-semibold">PHP {computedTotal.toLocaleString()}</span>
            </div>

            {availability ? (
              <div className={`rounded-md px-3 py-2 text-sm ${availability.available ? 'bg-success-500/10 text-success-200' : 'bg-danger-500/10 text-danger-200'}`}>
                {availability.available ? 'Selected range is available.' : 'Selected range has conflicts.'}
              </div>
            ) : null}

            {blockedRanges.length > 0 ? (
              <div className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-300">
                Unavailable ranges:{' '}
                {blockedRanges
                  .slice(0, 5)
                  .map((range) => `${range.start_date} to ${range.end_date}`)
                  .join(' • ')}
                {blockedRanges.length > 5 ? ' • …' : ''}
              </div>
            ) : null}

            {createStatus.error ? <p className="text-sm text-danger-500 md:col-span-2">{createStatus.error}</p> : null}

            <button
              className="w-fit rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
              disabled={createStatus.loading || !availability?.available}
              type="submit"
            >
              {createStatus.loading ? 'Creating...' : 'Create Booking'}
            </button>
          </form>
        </section>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-750 bg-neutral-800">
        <table className="min-w-full divide-y divide-neutral-750 text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Equipment</th>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">End</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-750">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-3 py-2">{customerMap[booking.customer_id]?.full_name || booking.customer_id}</td>
                <td className="px-3 py-2">{equipmentMap[booking.equipment_id]?.name || booking.equipment_id}</td>
                <td className="px-3 py-2">{booking.start_date}</td>
                <td className="px-3 py-2">{booking.end_date}</td>
                <td className="px-3 py-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-1 capitalize">
                    {booking.status}{booking.overdue ? ' • overdue' : ''}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Link className="rounded-md border border-neutral-700 px-2 py-1 hover:bg-neutral-900" to={`/dashboard/bookings/${booking.id}`}>
                      View
                    </Link>
                    {NEXT_STATUS[booking.status] ? (
                      <button
                        className="rounded-md bg-brand-500 px-2 py-1 text-xs font-semibold hover:bg-brand-600"
                        onClick={() => moveForward(booking)}
                        type="button"
                      >
                        Move to {NEXT_STATUS[booking.status]}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 ? <p className="p-4 text-sm text-neutral-400">No bookings found for these filters.</p> : null}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-300">
        <p>Total: {meta.total}</p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-neutral-700 px-3 py-1 disabled:opacity-40"
            disabled={filters.page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            type="button"
          >
            Prev
          </button>
          <span>Page {meta.page} / {meta.total_pages}</span>
          <button
            className="rounded-md border border-neutral-700 px-3 py-1 disabled:opacity-40"
            disabled={filters.page >= meta.total_pages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterInput({ label, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <input className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2" {...props} />
    </label>
  );
}

function FilterSelect({ label, children, ...props }) {
  return (
    <label className="block text-sm text-neutral-200">
      <span>{label}</span>
      <select className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2" {...props}>
        {children}
      </select>
    </label>
  );
}
