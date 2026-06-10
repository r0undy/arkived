/**
 * Circular progress indicator for the onboarding activation widget (F1.2).
 */
export default function ProgressRing({ value = 0, size = 56, stroke = 6, className = '', label }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${Math.round(clamped)}% complete`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-neutral-750"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-brand-500 transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-neutral-100">{label ?? `${Math.round(clamped)}%`}</span>
    </div>
  );
}
