import { Link } from 'react-router-dom';
import { ImageOff, Wrench, Plus, Check } from 'lucide-react';
import { useQuoteCart } from '../hooks/useQuoteCart';

const CONDITION_STYLES = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good: 'bg-sky-100 text-sky-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-rose-100 text-rose-700'
};

const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

/**
 * Conversion-focused storefront equipment card with photo, condition badge,
 * price, hover-lift, a clear unavailable state, and an add-to-quote control
 * (Frontend Roadmap F5.6).
 */
export default function EquipmentCard({ item, slug }) {
  const image = item.images?.find((img) => img.is_primary)?.storage_url || item.images?.[0]?.storage_url || '';
  const unavailable = item.status === 'maintenance' || item.status === 'archived' || item.status === 'rented';
  const conditionCls = CONDITION_STYLES[item.condition] || CONDITION_STYLES.good;
  const { has, add, remove } = useQuoteCart(slug);
  const inQuote = has(item.id);

  const toggleQuote = () => {
    if (inQuote) remove(item.id);
    else add(item);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/catalog/${item.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          {image ? (
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageOff className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
          {unavailable ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/55">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700">
                {item.status === 'maintenance' ? <Wrench className="h-3 w-3" aria-hidden="true" /> : null}
                {item.status === 'maintenance' ? 'In maintenance' : item.status === 'rented' ? 'Currently out' : 'Unavailable'}
              </span>
            </div>
          ) : null}
          {item.category ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 backdrop-blur">
              {item.category}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900">{item.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${conditionCls}`}>
              {item.condition || 'good'}
            </span>
          </div>
          {item.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{item.description}</p>
          ) : null}
          <div className="mt-auto flex items-center justify-between pt-4">
            <div>
              <p className="text-lg font-bold text-slate-900">{formatMoney(item.daily_rate)}</p>
              <p className="text-xs text-slate-400">per day</p>
            </div>
            <span
              className="rounded-lg px-3 py-2 text-sm font-semibold transition group-hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              View details
            </span>
          </div>
        </div>
      </Link>

      {!unavailable ? (
        <button
          type="button"
          onClick={toggleQuote}
          aria-pressed={inQuote}
          aria-label={inQuote ? `Remove ${item.name} from quote` : `Add ${item.name} to quote`}
          className={`absolute right-3 top-3 inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold shadow-sm transition ${
            inQuote
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white/95 text-slate-700 backdrop-blur hover:bg-white'
          }`}
        >
          {inQuote ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
          {inQuote ? 'Added' : 'Quote'}
        </button>
      ) : null}
    </div>
  );
}
