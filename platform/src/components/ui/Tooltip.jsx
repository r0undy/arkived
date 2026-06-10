import { useId, useState } from 'react';

const SIDE_CLASSES = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2'
};

/**
 * Lightweight accessible tooltip. Shows on hover and keyboard focus.
 * Wraps a single trigger element; content is announced via aria-describedby.
 */
export default function Tooltip({ content, side = 'top', children, className = '' }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (!content) return children;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? tooltipId : undefined} className="inline-flex">
        {children}
      </span>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 w-max max-w-60 rounded-md border border-neutral-750 bg-neutral-950 px-2.5 py-1.5 text-xs font-medium text-neutral-100 shadow-lg ${SIDE_CLASSES[side] || SIDE_CLASSES.top}`}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
