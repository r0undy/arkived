export default function EquipmentDetailPage({ item }) {
  if (!item) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-600">Equipment not found.</p>
      </div>
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm uppercase tracking-wide text-slate-500">{item.category}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{item.name}</h1>
      <p className="mt-4 max-w-3xl text-slate-700">{item.description || 'No description yet.'}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Stat label="Daily rate" value={`PHP ${Number(item.daily_rate).toLocaleString()}`} />
        <Stat label="Deposit" value={`PHP ${Number(item.deposit || 0).toLocaleString()}`} />
        <Stat label="Condition" value={item.condition || 'good'} />
        <Stat label="Status" value={item.status || 'available'} />
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}
