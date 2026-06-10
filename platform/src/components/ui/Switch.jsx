import { useId } from 'react';

/**
 * Accessible toggle switch (DSD §4.3 rounded-full).
 */
export default function Switch({ checked, onChange, label, description, id, disabled = false }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <label className="flex items-center justify-between gap-4" htmlFor={fieldId}>
      <span>
        {label ? <span className="block text-sm font-medium text-neutral-100">{label}</span> : null}
        {description ? <span className="block text-sm text-neutral-400">{description}</span> : null}
      </span>
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
          checked ? 'bg-brand-500' : 'bg-neutral-750'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
