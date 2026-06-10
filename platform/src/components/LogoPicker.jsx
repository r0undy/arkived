import { useState } from 'react';
import { Check } from 'lucide-react';
import { LOGO_PRESETS, LOGO_SHAPES, LogoPresetMark } from '../lib/logoPresets.jsx';
import { Button } from './ui';

/**
 * Logo preset gallery + recolor customizer (Frontend Roadmap F3).
 * Calls `onApply({ preset, color, shape })` when the user confirms.
 */
export default function LogoPicker({ accentColor = '#6366f1', applying = false, onApply, onCancel }) {
  const [selectedId, setSelectedId] = useState(LOGO_PRESETS[0].id);
  const [color, setColor] = useState(accentColor);
  const [shape, setShape] = useState('rounded');

  const selected = LOGO_PRESETS.find((preset) => preset.id === selectedId) || LOGO_PRESETS[0];
  const background = '#0f172a';

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-200">Pick a logo</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {LOGO_PRESETS.map((preset) => {
            const isActive = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedId(preset.id)}
                className={`relative flex aspect-square items-center justify-center rounded-lg border bg-neutral-950 p-2 transition hover:-translate-y-0.5 ${
                  isActive ? 'border-brand-400 ring-2 ring-brand-500/40' : 'border-neutral-750'
                }`}
                aria-label={`Select ${preset.name} logo`}
                aria-pressed={isActive}
              >
                <LogoPresetMark preset={preset} color={isActive ? color : '#94a3b8'} shape="none" className="h-9 w-9" />
                {isActive ? (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-200" htmlFor="logo-color">
              Logo color
            </label>
            <div className="flex items-center gap-2">
              <input
                id="logo-color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-12 rounded-md border border-neutral-750 bg-neutral-950"
              />
              <button
                type="button"
                className="rounded-md border border-neutral-750 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                onClick={() => setColor(accentColor)}
              >
                Use accent
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-neutral-200">Background shape</p>
            <div className="flex flex-wrap gap-2">
              {LOGO_SHAPES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setShape(option.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    shape === option.id
                      ? 'border-brand-400 bg-brand-500/10 text-brand-300'
                      : 'border-neutral-750 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview on light + dark */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white">
              <LogoPresetMark preset={selected} color={color} shape={shape} background={background} className="h-14 w-14" />
            </div>
            <span className="text-xs text-neutral-500">Light</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-neutral-900">
              <LogoPresetMark preset={selected} color={color} shape={shape} background="#1e293b" className="h-14 w-14" />
            </div>
            <span className="text-xs text-neutral-500">Dark</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={applying}>
          Cancel
        </Button>
        <Button
          type="button"
          loading={applying}
          onClick={() => onApply?.({ preset: selected, color, shape, background })}
        >
          Use this logo
        </Button>
      </div>
    </div>
  );
}
