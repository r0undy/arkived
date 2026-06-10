import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-60',
  secondary:
    'border border-neutral-750 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 active:bg-neutral-750 disabled:opacity-60',
  ghost: 'text-neutral-200 hover:bg-neutral-800 active:bg-neutral-750 disabled:opacity-50',
  danger: 'bg-danger-500 text-white hover:brightness-110 active:brightness-95 disabled:opacity-60'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-md gap-2',
  lg: 'px-5 py-2.5 text-md rounded-lg gap-2'
};

/**
 * Shared button primitive (DSD §7.3 micro-interactions).
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  className = '',
  children,
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <Component
      className={`inline-flex select-none items-center justify-center font-semibold transition duration-150 ease-out hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
      {children}
      {!loading && IconRight ? <IconRight aria-hidden="true" className="h-4 w-4" /> : null}
    </Component>
  );
}
