import { useId } from 'react';

const baseControl =
  'w-full rounded-md border border-neutral-750 bg-neutral-950 px-3 py-2 text-base text-neutral-50 placeholder:text-neutral-500 transition focus:border-brand-400';

function FieldShell({ label, htmlFor, helper, error, required, children }) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="block text-sm font-medium text-neutral-200" htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-0.5 text-danger-500" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-sm text-danger-500" role="alert">{error}</p>
      ) : helper ? (
        <p className="text-sm text-neutral-400">{helper}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, helper, error, required, className = '', id, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <FieldShell label={label} htmlFor={fieldId} helper={helper} error={error} required={required}>
      <input
        id={fieldId}
        className={`${baseControl} ${error ? 'border-danger-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

export function Textarea({ label, helper, error, required, className = '', id, rows = 4, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <FieldShell label={label} htmlFor={fieldId} helper={helper} error={error} required={required}>
      <textarea
        id={fieldId}
        rows={rows}
        className={`${baseControl} resize-y ${error ? 'border-danger-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({ label, helper, error, required, className = '', id, children, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <FieldShell label={label} htmlFor={fieldId} helper={helper} error={error} required={required}>
      <select
        id={fieldId}
        className={`${baseControl} ${error ? 'border-danger-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
