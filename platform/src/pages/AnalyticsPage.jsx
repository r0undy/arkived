export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-400">
        Revenue and utilization charts are scaffolded in the API. Connect this page to chart components for monthly trends,
        category split, and top-performing equipment.
      </p>
      <div className="mt-6 rounded-lg border border-neutral-750 bg-neutral-800 p-5">
        <p className="text-sm text-neutral-200">Planned widgets</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-400">
          <li>Monthly revenue bar chart</li>
          <li>Revenue by category donut chart</li>
          <li>Booking volume trend</li>
          <li>Average rental duration</li>
        </ul>
      </div>
    </div>
  );
}
