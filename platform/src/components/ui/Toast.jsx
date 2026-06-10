import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { cls: 'border-success-500/40 text-success-500', Icon: CheckCircle2 },
  error: { cls: 'border-danger-500/40 text-danger-500', Icon: XCircle },
  warning: { cls: 'border-warning-500/40 text-warning-500', Icon: AlertTriangle },
  info: { cls: 'border-info-500/40 text-info-500', Icon: Info }
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = 'info', duration = 4000) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((toast) => {
          const { cls, Icon } = VARIANTS[toast.variant] || VARIANTS.info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm animate-[toastIn_200ms_ease-out] items-start gap-2 rounded-lg border bg-neutral-800 px-4 py-3 text-sm text-neutral-100 shadow-[0_16px_48px_rgba(0,0,0,0.6)] ${cls}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-neutral-100">{toast.message}</p>
              <button
                className="text-neutral-400 hover:text-neutral-100"
                onClick={() => dismiss(toast.id)}
                type="button"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { push: () => {}, dismiss: () => {} };
  }
  return ctx;
}
