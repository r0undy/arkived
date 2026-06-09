import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminPage() {
  const [overview, setOverview] = useState({
    totalTenants: 0,
    newMTD: 0,
    totalBookings: 0,
    churnRate: 0
  });
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
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
      });
  }, []);

  const cards = [
    { label: 'Total Tenants', value: overview.totalTenants },
    { label: 'New This Month', value: overview.newMTD },
    { label: 'Total Bookings', value: overview.totalBookings },
    { label: 'Churn Rate', value: `${Number(overview.churnRate || 0).toFixed(1)}%` }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
      <p className="mt-2 text-sm text-neutral-400">Cross-tenant visibility for platform health.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
            <p className="text-sm text-neutral-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 overflow-x-auto rounded-lg border border-neutral-750 bg-neutral-800">
        <div className="border-b border-neutral-750 px-4 py-3">
          <h2 className="text-lg font-semibold tracking-tight">Tenants</h2>
        </div>
        <table className="min-w-full divide-y divide-neutral-750 text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Plan</th>
              <th className="px-3 py-2 text-left">Signup Date</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-750">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-3 py-2">{tenant.name}</td>
                <td className="px-3 py-2">{tenant.slug}</td>
                <td className="px-3 py-2">Free</td>
                <td className="px-3 py-2">{new Date(tenant.signup_date).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-1 capitalize">{tenant.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 ? <p className="p-4 text-sm text-neutral-400">No tenants found.</p> : null}
      </section>
    </div>
  );
}
