import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.customers({ q: q || undefined })
      .then((result) => setCustomers(result.data || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
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
      <PageHeader title="Customers" subtitle="Searchable customer directory with booking activity." />

      <div className="mt-6">
        <label className="block text-sm text-neutral-200">
          <span>Search</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
            <input
              className="w-full rounded-md border border-neutral-750 bg-neutral-950 py-2 pl-9 pr-3"
              onChange={(event) => setQ(event.target.value)}
              placeholder="Name, email, or phone"
              value={q}
            />
          </div>
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-750 bg-neutral-800">
        <table className="min-w-full divide-y divide-neutral-750 text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Bookings</th>
              <th className="px-4 py-3 text-left font-medium">Last activity</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-750">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-700" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 animate-pulse rounded bg-neutral-700" />
                          <div className="h-3 w-40 animate-pulse rounded bg-neutral-750" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-3.5 w-24 animate-pulse rounded bg-neutral-700" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-10 animate-pulse rounded bg-neutral-700" /></td>
                    <td className="px-4 py-3"><div className="h-3.5 w-28 animate-pulse rounded bg-neutral-700" /></td>
                    <td className="px-4 py-3"><div className="ml-auto h-6 w-16 animate-pulse rounded bg-neutral-700" /></td>
                  </tr>
                ))
              : rows.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-neutral-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-200">
                          {initials(customer.full_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-100">{customer.full_name}</p>
                          <p className="truncate text-xs text-neutral-400">{customer.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{customer.phone || '--'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={customer.bookingCount > 0 ? 'info' : 'neutral'} icon={false}>
                        {customer.bookingCount}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{new Date(customer.lastActivity).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-750 px-3 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
                        to={`/dashboard/customers/${customer.id}`}
                      >
                        View <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={Users}
            title={q ? 'No matching customers' : 'No customers yet'}
            description={
              q
                ? 'Try a different name, email, or phone number.'
                : 'Customers are created automatically when someone submits an inquiry from your storefront.'
            }
          />
        ) : null}
      </div>
    </div>
  );
}
