/**
 * Consistent page header for dashboard pages (Dashboard Redesign R2).
 * Renders a title, optional subtitle, and an optional actions slot with
 * shared top rhythm so every page opens the same way.
 */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-50">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-neutral-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
