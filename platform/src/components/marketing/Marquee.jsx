import { useEffect, useRef, useState } from 'react';

/**
 * Infinite, seamless, draggable marquee.
 *
 * Renders enough copies of its children to over-fill the viewport, then drives
 * the horizontal offset in JS via requestAnimationFrame. The loop period is the
 * real pixel distance between two adjacent copies (`offsetLeft` delta), so the
 * wrap is gapless regardless of item gap. Because the strip always extends past
 * the right edge, the first item appears immediately after the last — no empty
 * gap, no awkward reset.
 *
 * Users can drag the strip with mouse or finger; auto-scroll resumes on release.
 * Pauses on hover (mouse only) and is neutralized under prefers-reduced-motion.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {number} [props.duration=35] Seconds for one copy to pass.
 * @param {boolean} [props.reverse=false]
 * @param {string} [props.className]
 */
export default function Marquee({ children, duration = 35, reverse = false, className = '' }) {
  const items = Array.isArray(children) ? children : [children];

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const [copies, setCopies] = useState(2);
  const state = useRef({
    offset: 0,
    period: 0,
    paused: false,
    dragging: false,
    pointerId: null,
    startX: 0,
    startOffset: 0,
    moved: false,
    last: 0
  });

  // Decide how many copies are needed to over-fill the container width.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const recompute = () => {
      const unit =
        firstRef.current && secondRef.current
          ? secondRef.current.offsetLeft - firstRef.current.offsetLeft
          : firstRef.current?.offsetWidth || 0;
      const containerW = container.offsetWidth || 0;
      if (unit > 0) {
        // +2 so there is always at least one full copy beyond the right edge.
        const needed = Math.max(2, Math.ceil(containerW / unit) + 2);
        setCopies((prev) => (prev === needed ? prev : needed));
      }
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    if (firstRef.current) ro.observe(firstRef.current);
    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const s = state.current;

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      if (firstRef.current && secondRef.current) {
        s.period = secondRef.current.offsetLeft - firstRef.current.offsetLeft;
      }
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const dir = reverse ? -1 : 1;
    let raf;

    const tick = (now) => {
      const dt = s.last ? Math.min((now - s.last) / 1000, 0.05) : 0;
      s.last = now;

      if (!s.dragging && !s.paused && !prefersReduced && s.period > 0 && duration > 0) {
        const speed = s.period / duration; // px per second
        s.offset -= dir * speed * dt;
      }

      // Wrap into (-period, 0] so the strip loops forever in both directions.
      if (s.period > 0) {
        while (s.offset <= -s.period) s.offset += s.period;
        while (s.offset > 0) s.offset -= s.period;
      }

      track.style.transform = `translate3d(${s.offset}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [duration, reverse, items.length, copies]);

  const onPointerDown = (event) => {
    const s = state.current;
    s.dragging = true;
    s.moved = false;
    s.startX = event.clientX;
    s.startOffset = s.offset;
    s.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.style.cursor = 'grabbing';
  };

  const onPointerMove = (event) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = event.clientX - s.startX;
    if (Math.abs(dx) > 3) s.moved = true;
    s.offset = s.startOffset + dx;
  };

  const endDrag = (event) => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.pointerId != null) {
      event.currentTarget.releasePointerCapture?.(s.pointerId);
      s.pointerId = null;
    }
    event.currentTarget.style.cursor = 'grab';
  };

  // Suppress the click/navigation that follows a drag so dragging never triggers
  // a child link.
  const onClickCapture = (event) => {
    const s = state.current;
    if (s.moved) {
      event.preventDefault();
      event.stopPropagation();
      s.moved = false;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onMouseEnter={() => { state.current.paused = true; }}
      onMouseLeave={() => { state.current.paused = false; }}
    >
      <div ref={trackRef} className="flex w-max items-center gap-12 will-change-transform">
        {Array.from({ length: copies }).map((_, copy) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={copy}
            ref={copy === 0 ? firstRef : copy === 1 ? secondRef : undefined}
            className="flex shrink-0 items-center gap-12"
            aria-hidden={copy === 0 ? undefined : 'true'}
          >
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
