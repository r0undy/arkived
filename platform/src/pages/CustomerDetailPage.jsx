import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import Badge from '../components/ui/Badge';

const STATUS_VARIANT = {
  reserved: 'info',
  payment: 'warning',
  dispatched: 'info',
  returned: 'warning',
  inspected: 'info',
  closed: 'success'
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.customers(),
      api.customerBookings(id)
    ])
      .then(([customerListResult, bookingResult]) => {
        const found = (customerListResult.data || []).find((entry) => entry.id === id) || null;
        setCustomer(found);
        setBookings(bookingResult.data || []);
      })
      .catch(() => {
        setCustomer(null);
        setBookings([]);
      });
  }, [id]);

  return (
    <div>
      <div className="mb-4">
        <Link className="text-sm text-neutral-300 hover:text-brand-400" to="/dashboard/customers">
          ← Back to customers
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Customer Profile</h1>
      <p className="mt-2 text-sm text-neutral-400">{customer?.full_name || 'Loading customer...'}</p>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Contact</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <Info label="Full Name" value={customer?.full_name || '--'} />
          <Info label="Email" value={customer?.email || '--'} />
          <Info label="Phone" value={customer?.phone || '--'} />
          <Info label="Notes" value={customer?.notes || '--'} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Booking History Timeline</h2>
        <div className="mt-4 grid gap-3">
          {bookings.map((entry) => (
            <article key={entry.id} className="rounded-md border border-neutral-750 bg-neutral-900 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                <span>{new Date(entry.created_at).toLocaleString()}</span>
                <Badge variant={STATUS_VARIANT[entry.status] || 'neutral'} icon={false} className="capitalize">
                  {entry.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-neutral-200">
                {entry.start_date} to {entry.end_date} • PHP {Number(entry.total_amount || 0).toLocaleString()}
              </p>
              <Link className="mt-2 inline-block text-xs text-brand-300 hover:text-brand-200" to={`/dashboard/bookings/${entry.id}`}>
                Open booking
              </Link>
            </article>
          ))}
          {bookings.length === 0 ? <p className="text-sm text-neutral-400">No bookings yet for this customer.</p> : null}
        </div>
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
