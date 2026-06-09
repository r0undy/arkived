export default function PoweredByArkivedBadge({ enabled }) {
  if (!enabled) return null;

  return (
    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      Powered by Arkived
    </p>
  );
}
