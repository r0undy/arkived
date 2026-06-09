import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const linearize = (channel) => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const contrastRatio = (hexA, hexB) => {
  const normalize = (hex) => {
    const match = /^#([0-9a-f]{6})$/i.exec(hex || '');
    if (!match) return null;
    const value = match[1];
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  };

  const a = normalize(hexA);
  const b = normalize(hexB);
  if (a === null || b === null) return 0;

  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
};

export default function DashboardHomePage() {
  const [overview, setOverview] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [syncingChecklist, setSyncingChecklist] = useState(false);

  useEffect(() => {
    Promise.all([
      api.overview(),
      api.tenant(),
      api.equipment(),
      api.staff()
    ])
      .then(([overviewResult, tenantResult, equipmentResult, staffResult]) => {
        setOverview(overviewResult.data);
        setTenant(tenantResult.tenant);
        setEquipmentCount((equipmentResult.data || []).length);
        setStaffCount((staffResult.data || []).length);
      })
      .catch(() => {
        setOverview({ activeBookings: 0, overdueCount: 0, revenueMTD: 0, utilizationRate: 0 });
        setTenant(null);
        setEquipmentCount(0);
        setStaffCount(0);
      });
  }, []);

  const completedSteps = useMemo(() => {
    if (!tenant) return [];

    const steps = [];
    if (tenant.logo_url) steps.push('upload_logo');
    if (contrastRatio(tenant.accent_color, '#ffffff') >= 4.5) steps.push('set_accent_color');
    if (equipmentCount > 0) steps.push('add_first_equipment');
    if (staffCount > 1) steps.push('invite_team_member');

    return steps;
  }, [tenant, equipmentCount, staffCount]);

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
    { label: 'Overdue Rentals', value: overview?.overdueCount ?? '--' },
    { label: 'Revenue (MTD)', value: overview ? `PHP ${Number(overview.revenueMTD).toLocaleString()}` : '--' }
  ];

  const checklist = [
    {
      id: 'upload_logo',
      label: 'Upload logo',
      href: '/dashboard/settings/branding'
    },
    {
      id: 'set_accent_color',
      label: 'Set accent color (AA contrast)',
      href: '/dashboard/settings/branding'
    },
    {
      id: 'add_first_equipment',
      label: 'Add first equipment item',
      href: '/dashboard/equipment'
    },
    {
      id: 'invite_team_member',
      label: 'Invite a team member',
      href: '/dashboard/settings/team'
    }
  ];

  const completedLookup = new Set(completedSteps);
  const allDone = checklist.every((item) => completedLookup.has(item.id));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-400">Live KPI snapshot for your rental operations.</p>

      {!allDone ? (
        <section className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-100">Onboarding Checklist</p>
              <p className="text-xs text-neutral-400">Complete these steps to activate your storefront setup.</p>
            </div>
            <p className="text-xs text-neutral-400">
              {completedSteps.length}/{checklist.length} complete {syncingChecklist ? '• syncing' : ''}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            {checklist.map((item) => {
              const done = completedLookup.has(item.id);
              return (
                <Link
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-neutral-750 bg-neutral-900 px-3 py-2 text-sm"
                  to={item.href}
                >
                  <span className={done ? 'text-neutral-300 line-through' : 'text-neutral-100'}>{item.label}</span>
                  <span className={done ? 'text-success-500' : 'text-warning-500'}>{done ? 'Done' : 'Pending'}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-neutral-750 bg-neutral-800 p-4">
            <p className="text-sm text-neutral-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
