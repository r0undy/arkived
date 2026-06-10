import { useEffect, useState } from 'react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#0ea5e9', '#a855f7'];

/**
 * Lightweight, dependency-free confetti burst (Frontend Roadmap F1.2 / F7.1).
 * Pure CSS animation; respects prefers-reduced-motion (the global guard in
 * index.css collapses the animation, and we also bail out entirely).
 */
export default function Confetti({ count = 80, duration = 2600 }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(false);
      return undefined;
    }
    const timer = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!active) return null;

  const pieces = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const fall = 1.6 + Math.random() * 1.4;
    const size = 6 + Math.random() * 6;
    const color = COLORS[i % COLORS.length];
    return { left, delay, fall, size, color, round: i % 2 === 0 };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-70 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? '9999px' : '2px',
            animation: `confettiFall ${p.fall}s ease-in ${p.delay}s forwards`
          }}
        />
      ))}
    </div>
  );
}
