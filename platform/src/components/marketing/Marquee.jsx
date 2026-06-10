/**
 * Infinite, seamless marquee. Renders its children twice and translates the
 * track by -50% so the loop is gapless. Respects reduced motion (the CSS guard
 * neutralizes the animation). Pauses on hover.
 */
export default function Marquee({ children, duration = 35, reverse = false, className = '' }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={`marquee-paused group relative overflow-hidden ${className}`}>
      <div
        className="marquee-track flex w-max items-center gap-12"
        style={{ '--marquee-duration': `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-12" aria-hidden={copy === 1 ? 'true' : undefined}>
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
