import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const VARIANTS = {
  success: { cls: 'bg-success-500/15 text-success-500 border-success-500/30', Icon: CheckCircle2 },
  warning: { cls: 'bg-warning-500/15 text-warning-500 border-warning-500/30', Icon: AlertTriangle },
  danger: { cls: 'bg-danger-500/15 text-danger-500 border-danger-500/30', Icon: XCircle },
  info: { cls: 'bg-info-500/15 text-info-500 border-info-500/30', Icon: Info },
  neutral: { cls: 'bg-neutral-750/60 text-neutral-200 border-neutral-700', Icon: null }
};

/**
 * Status badge — never color-only (DSD §7.3, a11y). Always carries a text label
 * and (where meaningful) an icon.
 */
export default function Badge({ variant = 'neutral', icon = true, className = '', children }) {
  const { cls, Icon } = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium ${cls} ${className}`}
    >
      {icon && Icon ? <Icon aria-hidden="true" className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}
