/**
 * Multi-tenant attribution badge. Signals that this storefront is one of many
 * independent shops running on the shared Arkived platform. Shown when the
 * tenant keeps the watermark enabled.
 */
export default function PoweredByArkivedBadge({ enabled }) {
  if (!enabled) return null;

  return (
    <a
      href="https://arkived.dev"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
      title="Arkived hosts independent rental shops like this one"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded bg-slate-900 text-[9px] font-bold text-white" aria-hidden="true">
        A
      </span>
      <span>
        Powered by <span className="font-semibold text-slate-700">Arkived</span>
      </span>
    </a>
  );
}
