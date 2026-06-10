/**
 * Raised surface card (DSD §2.4 surface hierarchy, §5 elevation).
 */
export default function Card({
  as: Component = 'div',
  hover = false,
  padded = true,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`rounded-lg border border-neutral-750 bg-neutral-800 ${padded ? 'p-5' : ''} ${
        hover ? 'transition duration-150 ease-out hover:-translate-y-0.5 hover:border-neutral-700 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div>
        {title ? <h3 className="text-md font-semibold text-neutral-50">{title}</h3> : null}
        {subtitle ? <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
