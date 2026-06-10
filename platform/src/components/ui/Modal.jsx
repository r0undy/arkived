import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible modal dialog (DSD §5 elevation, §7.3 scale-from-0.96 entrance).
 * Converts to a full-height bottom sheet on small screens (responsive).
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div
        className={`w-full ${sizeCls} animate-[modalIn_300ms_ease-out] rounded-t-lg border border-neutral-750 bg-neutral-800 shadow-[0_16px_48px_rgba(0,0,0,0.6)] sm:rounded-lg`}
      >
        <div className="flex items-center justify-between border-b border-neutral-750 px-5 py-4">
          <h2 className="text-md font-semibold text-neutral-50">{title}</h2>
          <button
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-750 hover:text-neutral-100"
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-neutral-750 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
