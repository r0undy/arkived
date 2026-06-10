/**
 * Pre-saved, recolorable logo presets (Frontend Roadmap F3).
 *
 * Each preset's `paths` use `currentColor` so the chosen accent color applies
 * instantly. They are bundled statically so the picker works with no backend
 * dependency (the optional GET /branding/logo-presets endpoint can replace this
 * later without changing the component contract).
 */

export const LOGO_PRESETS = [
  {
    id: 'box',
    name: 'Archive Box',
    paths: (
      <>
        <path d="M6 14h36v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14Z" fill="currentColor" opacity="0.18" />
        <path d="M4 10h40v6H4z" fill="currentColor" />
        <path d="M6 16h36v22a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V16Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M19 23h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'bracket',
    name: 'Bracket',
    paths: (
      <>
        <path d="M19 8h-7a4 4 0 0 0-4 4v8a4 4 0 0 1-4 4 4 4 0 0 1 4 4v8a4 4 0 0 0 4 4h7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M29 8h7a4 4 0 0 1 4 4v8a4 4 0 0 0 4 4 4 4 0 0 0-4 4v8a4 4 0 0 1-4 4h-7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    )
  },
  {
    id: 'layers',
    name: 'Layers',
    paths: (
      <>
        <path d="M24 6 6 16l18 10 18-10L24 6Z" fill="currentColor" opacity="0.2" />
        <path d="M24 6 6 16l18 10 18-10L24 6Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" fill="none" />
        <path d="M6 24l18 10 18-10M6 32l18 10 18-10" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" fill="none" />
      </>
    )
  },
  {
    id: 'wrench',
    name: 'Tools',
    paths: (
      <>
        <path d="M30 8a8 8 0 0 0-7.5 10.7L9 32.2a3.5 3.5 0 0 0 5 5l13.4-13.5A8 8 0 1 0 30 8Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none" />
        <circle cx="32" cy="16" r="2.5" fill="currentColor" />
      </>
    )
  },
  {
    id: 'camera',
    name: 'Camera',
    paths: (
      <>
        <rect x="5" y="14" width="38" height="26" rx="4" stroke="currentColor" strokeWidth="2.8" fill="none" />
        <path d="M17 14l3-5h8l3 5" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" fill="none" />
        <circle cx="24" cy="27" r="7" stroke="currentColor" strokeWidth="2.8" fill="none" />
      </>
    )
  },
  {
    id: 'tent',
    name: 'Outdoor',
    paths: (
      <>
        <path d="M24 8 6 38h36L24 8Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" fill="none" />
        <path d="M24 16 16 38h16L24 16Z" fill="currentColor" opacity="0.2" />
        <path d="M24 16 16 38M24 16l8 22" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      </>
    )
  },
  {
    id: 'speaker',
    name: 'Audio',
    paths: (
      <>
        <rect x="12" y="6" width="24" height="36" rx="5" stroke="currentColor" strokeWidth="2.8" fill="none" />
        <circle cx="24" cy="29" r="7" stroke="currentColor" strokeWidth="2.8" fill="none" />
        <circle cx="24" cy="14" r="2.5" fill="currentColor" />
      </>
    )
  },
  {
    id: 'sparkle',
    name: 'Spark',
    paths: (
      <path
        d="M24 5c1 9 5 13 14 14-9 1-13 5-14 14-1-9-5-13-14-14 9-1 13-5 14-14Z"
        fill="currentColor"
      />
    )
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    paths: (
      <>
        <path d="M24 5 41 15v18L24 43 7 33V15L24 5Z" fill="currentColor" opacity="0.18" />
        <path d="M24 5 41 15v18L24 43 7 33V15L24 5Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" fill="none" />
        <path d="M24 16v16M17 20l14 8M31 20l-14 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </>
    )
  },
  {
    id: 'shield',
    name: 'Shield',
    paths: (
      <>
        <path d="M24 5 8 11v12c0 11 7 17 16 20 9-3 16-9 16-20V11L24 5Z" fill="currentColor" opacity="0.18" />
        <path d="M24 5 8 11v12c0 11 7 17 16 20 9-3 16-9 16-20V11L24 5Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" fill="none" />
        <path d="M18 24l5 5 8-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    )
  },
  {
    id: 'truck',
    name: 'Delivery',
    paths: (
      <>
        <path d="M5 14h22v16H5z" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinejoin="round" />
        <path d="M27 20h8l6 6v4h-14V20Z" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinejoin="round" />
        <circle cx="15" cy="34" r="4" stroke="currentColor" strokeWidth="2.8" fill="none" />
        <circle cx="34" cy="34" r="4" stroke="currentColor" strokeWidth="2.8" fill="none" />
      </>
    )
  },
  {
    id: 'tag',
    name: 'Tag',
    paths: (
      <>
        <path d="M7 7h16l18 18-16 16L7 23V7Z" fill="currentColor" opacity="0.18" />
        <path d="M7 7h16l18 18-16 16L7 23V7Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" fill="none" />
        <circle cx="16" cy="16" r="3" fill="currentColor" />
      </>
    )
  }
];

export const LOGO_SHAPES = [
  { id: 'none', label: 'None' },
  { id: 'rounded', label: 'Rounded square' },
  { id: 'circle', label: 'Circle' }
];

export function getPreset(id) {
  return LOGO_PRESETS.find((preset) => preset.id === id) || null;
}

/**
 * Render a preset mark as an inline SVG.
 */
export function LogoPresetMark({ preset, color = '#6366f1', shape = 'none', background = '#0f172a', className = 'h-12 w-12' }) {
  if (!preset) return null;

  const hasBackground = shape !== 'none';

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={`${preset.name} logo`} xmlns="http://www.w3.org/2000/svg">
      {hasBackground ? (
        <rect x="0" y="0" width="48" height="48" rx={shape === 'rounded' ? 11 : 24} fill={background} />
      ) : null}
      <g style={{ color }} transform={hasBackground ? 'translate(7 7) scale(0.71)' : undefined}>
        {preset.paths}
      </g>
    </svg>
  );
}
