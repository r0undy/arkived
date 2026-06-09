import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function DashboardHomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.overview().then((result) => setData(result.data)).catch(() => {
      setData({ activeBookings: 0, overdueCount: 0, revenueMTD: 0, utilizationRate: 0 });
    });
  }, []);

  const cards = [
    { label: 'Utilization Rate', value: `${data?.utilizationRate ?? '--'}%` },
    { label: 'Active Bookings', value: data?.activeBookings ?? '--' },
    { label: 'Overdue Rentals', value: data?.overdueCount ?? '--' },
    { label: 'Revenue (MTD)', value: data ? `PHP ${Number(data.revenueMTD).toLocaleString()}` : '--' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-400">Live KPI snapshot for your rental operations.</p>
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
