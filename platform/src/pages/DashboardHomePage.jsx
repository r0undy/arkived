import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ActivationWidget from '../components/ActivationWidget';
import { computeCompletedSteps, shouldRouteToWelcome } from '../lib/onboarding';

export default function DashboardHomePage() {
  const [overview, setOverview] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);
  const [equipmentLookup, setEquipmentLookup] = useState({});
  const [customerLookup, setCustomerLookup] = useState({});
  const [underperformingAssets, setUnderperformingAssets] = useState([]);
  const [syncingChecklist, setSyncingChecklist] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.overview(),
      api.tenant(),
      api.equipment(),
      api.staff(),
      api.bookings({ page: 1, limit: 5 }),
      api.customers(),
      api.analyticsUtilization()
    ])
      .then(([
        overviewResult,
        tenantResult,
        equipmentResult,
        staffResult,
        bookingResult,
        customerResult,
        utilizationResult
      ]) => {
        const equipment = equipmentResult.data || [];
        const customers = customerResult.data || [];

        setOverview(overviewResult.data);
        setTenant(tenantResult.tenant);
        setEquipmentCount(equipment.length);
        setStaffCount((staffResult.data || []).length);
        setRecentBookings(bookingResult.data || []);
        setEquipmentLookup(Object.fromEntries(equipment.map((item) => [item.id, item])));
        setCustomerLookup(Object.fromEntries(customers.map((item) => [item.id, item])));
        setUnderperformingAssets(
          (utilizationResult.data || [])
            .filter((entry) => Number(entry.utilization_rate || 0) < 20)
            .sort((a, b) => Number(a.utilization_rate || 0) - Number(b.utilization_rate || 0))
        );
      })
      .catch(() => {
        setOverview({ activeBookings: 0, overdueCount: 0, revenueMTD: 0, utilizationRate: 0 });
        setTenant(null);
        setEquipmentCount(0);
        setStaffCount(0);
        setRecentBookings([]);
        setEquipmentLookup({});
        setCustomerLookup({});
        setUnderperformingAssets([]);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded && shouldRouteToWelcome(tenant, { equipmentCount })) {
      navigate('/welcome', { replace: true });
    }
  }, [loaded, tenant, equipmentCount, navigate]);

  const completedSteps = useMemo(
    () => computeCompletedSteps(tenant, { equipmentCount, staffCount }),
    [tenant, equipmentCount, staffCount]
  );

  useEffect(() => {
    if (!tenant) return;
    const current = (tenant.onboarding_completed_steps || []).slice().sort();
    const next = completedSteps.slice().sort();

    if (JSON.stringify(current) === JSON.stringify(next)) return;

    setSyncingChecklist(true);
    api.updateBranding({ onboarding_completed_steps: next })
      .then((result) => setTenant(result.tenant))
      .catch(() => {
        // Keep UI usable even when checklist sync fails.
      })
      .finally(() => setSyncingChecklist(false));
  }, [tenant, completedSteps]);

  const cards = [
    { label: 'Utilization Rate', value: `${overview?.utilizationRate ?? '--'}%` },
    { label: 'Active Bookings', value: overview?.activeBookings ?? '--' },
    {
      label: 'Overdue Rentals',
      value: overview?.overdueCount ?? '--',
      alert: Number(overview?.overdueCount || 0) > 0
    },
    { label: 'Revenue (MTD)', value: overview ? `PHP ${Number(overview.revenueMTD).toLocaleString()}` : '--' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-400">Live KPI snapshot for your rental operations.</p>

      <ActivationWidget
        tenant={tenant}
        equipmentCount={equipmentCount}
        staffCount={staffCount}
        syncing={syncingChecklist}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border p-4 ${
              card.alert
                ? 'border-warning-500/40 bg-warning-500/10'
                : 'border-neutral-750 bg-neutral-800'
            }`}
          >
            <p className="text-sm text-neutral-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold hover:bg-brand-600" to="/dashboard/equipment">
            + Add Equipment
          </Link>
          <Link className="rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900" to="/dashboard/bookings">
            + New Booking
          </Link>
          <Link className="rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900" to="/dashboard/calendar">
            View Calendar
          </Link>
        </div>
      </section>

      <section className="mt-6 overflow-x-auto rounded-lg border border-neutral-750 bg-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-750 px-4 py-3">
          <h2 className="text-lg font-semibold tracking-tight">Recent Bookings</h2>
          <Link className="text-sm text-brand-300 hover:text-brand-200" to="/dashboard/bookings">
            View all
          </Link>
        </div>
        <table className="min-w-full divide-y divide-neutral-750 text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Equipment</th>
              <th className="px-3 py-2 text-left">Dates</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-750">
            {recentBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-3 py-2">{customerLookup[booking.customer_id]?.full_name || booking.customer_id}</td>
                <td className="px-3 py-2">{equipmentLookup[booking.equipment_id]?.name || booking.equipment_id}</td>
                <td className="px-3 py-2">{booking.start_date} to {booking.end_date}</td>
                <td className="px-3 py-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-1 capitalize">{booking.status}</span>
                </td>
                <td className="px-3 py-2">PHP {Number(booking.total_amount || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentBookings.length === 0 ? <p className="p-4 text-sm text-neutral-400">No recent bookings.</p> : null}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
        <h2 className="text-lg font-semibold tracking-tight">Underperforming Assets</h2>
        <p className="mt-1 text-xs text-neutral-400">Assets with utilization below 20% in the current utilization window.</p>
        <div className="mt-3 grid gap-2">
          {underperformingAssets.map((item) => (
            <div key={item.equipment_id} className="flex items-center justify-between rounded-md border border-neutral-750 bg-neutral-900 px-3 py-2 text-sm">
              <span>{item.equipment_name}</span>
              <span className="text-warning-300">{item.utilization_rate}%</span>
            </div>
          ))}
          {underperformingAssets.length === 0 ? (
            <p className="text-sm text-neutral-400">No underperforming assets in this range.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
