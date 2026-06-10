import { useEffect, useState } from 'react';

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'A';

/**
 * Full-screen branded splash for the storefront. While the tenant resolves it
 * shows a neutral mark; once ready it reveals the tenant's logo and company
 * name, then fades out and calls onDone.
 */
export default function StorefrontSplash({ tenant, ready, onDone }) {
  const [hidden, setHidden] = useState(false);

  // Once the tenant has resolved, hold the branded splash briefly then fade.
  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => setHidden(true), 650);
    return () => clearTimeout(timer);
  }, [ready]);

  // After the fade transition completes, unmount the splash.
  useEffect(() => {
    if (!hidden) return undefined;
    const timer = setTimeout(() => onDone?.(), 520);
    return () => clearTimeout(timer);
  }, [hidden, onDone]);

  const name = tenant?.name || '';
  const logo = tenant?.logo_url || '';
  const accent = tenant?.accent_color || '#6366f1';

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-5 bg-white transition-opacity duration-500 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden={hidden}
    >
      {logo ? (
        <img
          src={logo}
          alt={name || 'Storefront'}
          className="h-20 w-20 object-contain motion-safe:animate-[scaleIn_0.4s_ease-out]"
        />
      ) : (
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white motion-safe:animate-[scaleIn_0.4s_ease-out]"
          style={{ backgroundColor: accent }}
        >
          {initialsOf(name)}
        </div>
      )}

      {name ? (
        <p className="text-xl font-semibold tracking-tight text-slate-900 motion-safe:animate-[fadeIn_0.5s_ease-out]">
          {name}
        </p>
      ) : (
        <span className="text-lg font-semibold tracking-tight text-slate-400">Loading…</span>
      )}

      <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full w-1/3 rounded-full motion-safe:animate-[floatY_1.2s_ease-in-out_infinite]"
          style={{ backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
