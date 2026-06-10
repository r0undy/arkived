/**
 * Arkived wordmark + mark (DSD §1.2). The mark is a bracket/box motif evoking
 * storage & archiving. Inherits currentColor so it adapts to its surface.
 */
export function ArkivedMark({ className = 'h-7 w-7', title = 'Arkived' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="26" height="26" rx="7" className="fill-brand-500" />
      <path
        d="M11 22V13a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v9"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M11 17.5h10" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Wordmark({ className = '', markClassName = 'h-7 w-7' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <ArkivedMark className={markClassName} />
      <span className="text-xl font-bold tracking-tight text-neutral-50">arkived</span>
    </span>
  );
}
