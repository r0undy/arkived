import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.customers({ q: q || undefined })
      .then((result) => setCustomers(result.data || []))
      .catch(() => setCustomers([]));
  }, [q]);

  useEffect(() => {
    const run = async () => {
      const pairs = await Promise.all(
        customers.map(async (customer) => {
          try {
            const result = await api.customerBookings(customer.id);
            const bookings = result.data || [];
            return [customer.id, {
              bookingCount: bookings.length,
              lastActivity: bookings[0]?.created_at || customer.created_at
            }];
          } catch (_error) {
            return [customer.id, { bookingCount: 0, lastActivity: customer.created_at }];
          }
        })
      );
      setStats(Object.fromEntries(pairs));
    };

    if (customers.length === 0) {
      setStats({});
      return;
    }

    run();
  }, [customers]);

  const rows = useMemo(
    () => customers.map((customer) => ({
      ...customer,
      bookingCount: stats[customer.id]?.bookingCount || 0,
      lastActivity: stats[customer.id]?.lastActivity || customer.created_at
    })),
    [customers, stats]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
      <p className="mt-2 text-sm text-neutral-400">Searchable customer directory with booking activity.</p>

      <div className="mt-6">
        <label className="block text-sm text-neutral-200">
          <span>Search</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2"
            onChange={(event) => setQ(event.target.value)}
            placeholder="Name, email, or phone"
            value={q}
          />
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-750 bg-neutral-800">
        <table className="min-w-full divide-y divide-neutral-750 text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Bookings</th>
              <th className="px-3 py-2 text-left">Last Activity</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-750">
            {rows.map((customer) => (
              <tr key={customer.id}>
                <td className="px-3 py-2">{customer.full_name}</td>
                <td className="px-3 py-2">{customer.email || '--'}</td>
                <td className="px-3 py-2">{customer.phone || '--'}</td>
                <td className="px-3 py-2">{customer.bookingCount}</td>
                <td className="px-3 py-2">{new Date(customer.lastActivity).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <Link
                    className="rounded-md border border-neutral-700 px-2 py-1 hover:bg-neutral-900"
                    to={`/dashboard/customers/${customer.id}`}
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-sm text-neutral-400">No customers found.</p> : null}
      </div>
    </div>
  );
}
