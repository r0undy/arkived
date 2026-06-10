import { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Lightweight, privacy-friendly YouTube facade: shows the thumbnail with a
 * play button and only loads the iframe on click (no third-party JS until
 * the user opts in). Uses the youtube-nocookie domain.
 */
export default function YouTubeEmbed({ videoId, title = 'Product demo' }) {
  const [active, setActive] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-750 bg-neutral-900 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play video: ${title}`}
        >
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-neutral-950/70 via-transparent to-transparent" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition group-hover:scale-110 group-hover:bg-brand-600"
          >
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
          <span className="absolute bottom-4 left-4 rounded-full bg-neutral-950/70 px-3 py-1 text-xs font-medium text-neutral-100 backdrop-blur">
            {title}
          </span>
        </button>
      )}
    </div>
  );
}
