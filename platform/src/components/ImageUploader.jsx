import { useRef, useState } from 'react';
import { UploadCloud, Loader2, X, RotateCcw } from 'lucide-react';

/**
 * Reusable drag-and-drop image uploader (Frontend Roadmap F4.1).
 * Validates type + size client-side, shows a preview, and reports the chosen
 * file to the parent which performs the actual upload.
 */
export default function ImageUploader({
  label,
  hint,
  accept = 'image/png,image/jpeg,image/webp',
  maxSizeMb = 5,
  previewUrl = '',
  uploading = false,
  disabled = false,
  error = '',
  onFile,
  onClear,
  onRetry,
  aspect = 'aspect-video'
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');

  const validate = (file) => {
    const allowed = accept.split(',').map((type) => type.trim());
    if (allowed.length && !allowed.includes(file.type)) {
      return `Unsupported file type. Allowed: ${allowed.map((type) => type.replace('image/', '')).join(', ')}.`;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `File is too large. Max ${maxSizeMb}MB.`;
    }
    return '';
  };

  const handleFile = (file) => {
    if (!file) return;
    const validationError = validate(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError('');
    onFile?.(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const shownError = localError || error;

  return (
    <div className="space-y-1.5">
      {label ? <p className="text-sm font-medium text-neutral-200">{label}</p> : null}
      <div
        className={`relative flex ${aspect} w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition ${
          dragActive ? 'border-brand-400 bg-brand-500/5' : 'border-neutral-750 bg-neutral-950'
        } ${disabled ? 'opacity-50' : 'cursor-pointer hover:border-neutral-700'}`}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label={label || 'Upload image'}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Upload preview" className="h-full w-full object-contain" />
            {onClear ? (
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-neutral-900/80 p-1 text-neutral-200 hover:bg-neutral-800"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <UploadCloud className="h-7 w-7 text-neutral-400" aria-hidden="true" />
            <p className="text-sm text-neutral-300">
              <span className="font-semibold text-brand-400">Click to upload</span> or drag and drop
            </p>
            {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/70">
            <Loader2 className="h-6 w-6 animate-spin text-brand-400" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {shownError ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-danger-500" role="alert">{shownError}</p>
          {onRetry ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-300 hover:text-neutral-100"
              onClick={onRetry}
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
