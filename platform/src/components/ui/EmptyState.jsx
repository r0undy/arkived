/**
 * Empty state pattern (DSD §9.2 — explain why empty + offer one clear action).
 */
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-750 bg-neutral-800/50 px-6 py-12 text-center ${className}`}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-750/60 text-brand-400">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      ) : null}
      {title ? <h3 className="text-md font-semibold text-neutral-100">{title}</h3> : null}
      {description ? <p className="mt-1 max-w-sm text-sm text-neutral-400">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
