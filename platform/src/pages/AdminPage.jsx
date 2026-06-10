import { useEffect, useState } from 'react';
import { Building2, UserPlus, CalendarCheck, TrendingDown, Store } from 'lucide-react';
import { api } from '../lib/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const STATUS_VARIANT = {
  active: 'success',
  suspended: 'danger',
  pending: 'warning'
};

export default function AdminPage() {
  const [overview, setOverview] = useState({
    totalTenants: 0,
    newMTD: 0,
    totalBookings: 0,
    churnRate: 0
  });
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.adminOverview(), api.adminTenants()])
      .then(([overviewResult, tenantsResult]) => {
        setOverview(overviewResult.data || {
          totalTenants: 0,
          newMTD: 0,
          totalBookings: 0,
          churnRate: 0
        });
        setTenants(tenantsResult.data || []);
      })
      .catch(() => {
        setOverview({
          totalTenants: 0,
          newMTD: 0,
          totalBookings: 0,
          churnRate: 0
        });
        setTenants([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Tenants', value: overview.totalTenants, icon: Building2 },
    { label: 'New This Month', value: overview.newMTD, icon: UserPlus },
    { label: 'Total Bookings', value: overview.totalBookings, icon: CalendarCheck },
    { label: 'Churn Rate', value: `${Number(overview.churnRate || 0).toFixed(1)}%`, icon: TrendingDown }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
      <p className="mt-2 text-sm text-neutral-400">Cross-tenant visibility for platform health.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-700" />
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-neutral-700" />
              </Card>
            ))
          : cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-neutral-400">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                </Card>
              );
            })}
      </div>

      <Card className="mt-6 overflow-hidden" padded={false}>
        <div className="border-b border-neutral-750 px-4 py-3">
          <h2 className="text-lg font-semibold tracking-tight">Tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-750 text-sm">
            <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Signup date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-750">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 5 }).map((__, col) => (
                        <td key={col} className="px-4 py-3"><div className="h-3.5 w-20 animate-pulse rounded bg-neutral-700" /></td>
                      ))}
                    </tr>
                  ))
                : tenants.map((tenant) => (
                    <tr key={tenant.id} className="transition hover:bg-neutral-800/60">
                      <td className="px-4 py-3 font-medium text-neutral-100">{tenant.name}</td>
                      <td className="px-4 py-3 text-neutral-300">{tenant.slug}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral" icon={false}>Free</Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">{new Date(tenant.signup_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[tenant.status] || 'neutral'} icon={false} className="capitalize">
                          {tenant.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && tenants.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={Store}
            title="No tenants yet"
            description="New shops will appear here as they sign up on the platform."
          />
        ) : null}
      </Card>
    </div>
  );
}
