import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Table, TableContainer, THead, Th, TBody, Tr, Td } from '../components/ui/Table';
import { CalendarCheck } from 'lucide-react';
import { useNewInquiries } from '../hooks/useNewInquiries';

const NEXT_STATUS = {
  reserved: 'payment',
  payment: 'dispatched',
  dispatched: 'returned',
  returned: 'inspected',
  inspected: 'closed'
};
const BLOCKING_STATUSES = new Set(['reserved', 'payment', 'dispatched', 'returned', 'inspected']);
const STATUS_VARIANT = {
  reserved: 'info',
  payment: 'warning',
  dispatched: 'info',
  returned: 'warning',
  inspected: 'info',
  closed: 'success'
};
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
  const { newInquiries, acknowledge } = useNewInquiries({ poll: false });
  const newInquiryIds = useMemo(() => new Set(newInquiries.map((entry) => entry.id)), [newInquiries]);

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

  // Acknowledge storefront inquiries when the operator leaves this view so the
  // dashboard/nav "new requests" signal clears once they've been seen (F8.2).
  const acknowledgeRef = useRef(acknowledge);
  acknowledgeRef.current = acknowledge;
  useEffect(() => () => acknowledgeRef.current(), []);

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
      <PageHeader title="Bookings" subtitle="Track reservation-to-return pipeline." />

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

      <TableContainer className="mt-6">
        <Table>
          <THead>
            <Th>Customer</Th>
            <Th>Equipment</Th>
            <Th>Start</Th>
            <Th>End</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </THead>
          <TBody>
            {bookings.map((booking) => {
              const isNew = newInquiryIds.has(booking.id);
              return (
                <Tr key={booking.id} highlight={isNew}>
                  <Td>
                    <span className="flex items-center gap-2">
                      {isNew ? <Badge variant="info">New</Badge> : null}
                      <span className="font-medium text-neutral-100">
                        {customerMap[booking.customer_id]?.full_name || booking.customer_id}
                      </span>
                    </span>
                  </Td>
                  <Td className="text-neutral-300">{equipmentMap[booking.equipment_id]?.name || booking.equipment_id}</Td>
                  <Td className="tabular-nums text-neutral-300">{booking.start_date}</Td>
                  <Td className="tabular-nums text-neutral-300">{booking.end_date}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <Badge variant={STATUS_VARIANT[booking.status] || 'neutral'} icon={false} className="capitalize">
                        {booking.status}
                      </Badge>
                      {booking.overdue ? <Badge variant="danger">Overdue</Badge> : null}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        className="inline-flex items-center rounded-md border border-neutral-750 px-2.5 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-700 hover:text-white"
                        to={`/dashboard/bookings/${booking.id}`}
                      >
                        View
                      </Link>
                      {NEXT_STATUS[booking.status] ? (
                        <button
                          className="rounded-md bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-600"
                          onClick={() => moveForward(booking)}
                          type="button"
                        >
                          Move to {NEXT_STATUS[booking.status]}
                        </button>
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
        {bookings.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={CalendarCheck}
            title="No bookings yet"
            description="When customers reserve gear from your storefront — or you add a booking here — it shows up in this pipeline."
            action={
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Create a booking
              </button>
            }
          />
        ) : null}
      </TableContainer>

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
