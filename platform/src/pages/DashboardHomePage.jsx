import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Inbox, ArrowRight, Store, ExternalLink, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import ActivationWidget from '../components/ActivationWidget';
import Badge from '../components/ui/Badge';
import Sparkline from '../components/ui/Sparkline';
import { useNewInquiries } from '../hooks/useNewInquiries';
import { computeCompletedSteps, shouldRouteToWelcome } from '../lib/onboarding';

const STOREFRONT_DOMAIN = import.meta.env.VITE_STOREFRONT_DOMAIN || 'arkived.dev';

function VisitSiteCard({ tenant }) {
  const [copied, setCopied] = useState(false);
  if (!tenant?.slug) return null;

  const storefrontUrl = `${tenant.slug}.${STOREFRONT_DOMAIN}`;
  const href = `https://${storefrontUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-750 bg-neutral-800 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
          <Store aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100">Your storefront is live</p>
          <a href={href} target="_blank" rel="noreferrer" className="truncate font-mono text-xs text-brand-400 hover:underline">
            {storefrontUrl}
          </a>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-750 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:text-neutral-100"
        >
          {copied ? <Check aria-hidden="true" className="h-4 w-4 text-success-500" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Visit site <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

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
  const [volumeTrend, setVolumeTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const { newInquiries, count: inquiryCount } = useNewInquiries();

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

  useEffect(() => {
    Promise.all([
      api.analyticsBookingVolume().catch(() => ({ data: [] })),
      api.analyticsRevenue().catch(() => ({ data: [] }))
    ]).then(([volumeResult, revenueResult]) => {
      setVolumeTrend((volumeResult.data || []).map((entry) => entry.count));
      setRevenueTrend((revenueResult.data || []).map((entry) => entry.revenue));
    });
  }, []);

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
    { label: 'Active Bookings', value: overview?.activeBookings ?? '--', trend: volumeTrend },
    {
      label: 'Overdue Rentals',
      value: overview?.overdueCount ?? '--',
      alert: Number(overview?.overdueCount || 0) > 0
    },
    {
      label: 'Revenue (MTD)',
      value: overview ? `PHP ${Number(overview.revenueMTD).toLocaleString()}` : '--',
      trend: revenueTrend
    }
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live KPI snapshot for your rental operations." />

      <VisitSiteCard tenant={tenant} />

      <ActivationWidget
        tenant={tenant}
        equipmentCount={equipmentCount}
        staffCount={staffCount}
        syncing={syncingChecklist}
      />

      {inquiryCount > 0 ? (
        <section className="mt-6 rounded-xl border border-info-500/40 bg-info-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-500/20 text-info-500">
                <Inbox aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-100">
                  {inquiryCount} new {inquiryCount === 1 ? 'request' : 'requests'} from your storefront
                </p>
                <p className="text-xs text-neutral-400">
                  Customers reserved equipment online. Review and move them through the pipeline.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/bookings"
              className="inline-flex items-center gap-1.5 rounded-md bg-info-500 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-110 sm:ml-auto"
            >
              Review requests <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-3 grid gap-2">
            {newInquiries.slice(0, 3).map((booking) => (
              <li key={booking.id}>
                <Link
                  to={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center justify-between rounded-lg border border-info-500/20 bg-neutral-900 px-3 py-2 text-sm transition hover:border-info-500/40"
                >
                  <span className="truncate text-neutral-200">
                    {equipmentLookup[booking.equipment_id]?.name || 'Equipment'} · {booking.start_date} → {booking.end_date}
                  </span>
                  <Badge variant="info">New</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
              {card.trend && card.trend.length > 1 ? (
                <Sparkline data={card.trend} strokeClass={card.alert ? 'text-warning-400' : 'text-brand-400'} />
              ) : null}
            </div>
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
