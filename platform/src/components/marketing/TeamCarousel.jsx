import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const initialsOf = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

function TeamCard({ member }) {
  return (
    <article className="group relative w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-750 bg-neutral-800 transition duration-300 hover:-translate-y-1.5 hover:border-brand-500/50 hover:shadow-[0_18px_48px_rgba(0,0,0,0.45)] sm:w-64">
      {/* Portrait */}
      <div className={`relative aspect-4/5 w-full overflow-hidden ${member.tone || 'bg-neutral-900'}`}>
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-bold text-white/90" aria-hidden="true">{initialsOf(member.name)}</span>
          </div>
        )}
        {/* Gradient scrim + name overlay */}
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-neutral-950/85 via-neutral-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-lg font-semibold text-white drop-shadow">{member.name}</h3>
          <p className="mt-0.5 text-sm text-brand-200">{member.role}</p>
        </div>
        {/* Hover accent line */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-1 w-0 bg-brand-500 transition-all duration-300 group-hover:w-full"
        />
      </div>
    </article>
  );
}

/**
 * Manually-controlled "meet the team" slider. Portrait cards (image or initials
 * fallback) scroll horizontally via the left/right controls; the track keeps
 * vertical padding so the hover lift + shadow are never clipped.
 */
export default function TeamCarousel({ members = [] }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);

  const scrollByCards = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('article');
    const amount = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: amount * direction, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="mb-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          disabled={atStart}
          aria-label="Previous team members"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-750 bg-neutral-800 text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          disabled={atEnd}
          aria-label="Next team members"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-750 bg-neutral-800 text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-2 flex snap-x gap-5 overflow-x-auto scroll-smooth px-2 py-4"
      >
        {members.map((member) => (
          <TeamCard key={member.name} member={member} />
        ))}
      </div>
    </div>
  );
}
