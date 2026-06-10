/**
 * Multi-item "Request a quote" cart (Frontend Roadmap F5.6).
 * Stored per-tenant in localStorage. A customer can collect several items,
 * then submit a single inquiry covering all of them from the Quote page.
 *
 * Same-tab reactivity is broadcast via a CustomEvent since the native
 * `storage` event only fires in *other* tabs.
 */
const EVENT = 'arkived:quote-cart';
const keyFor = (slug) => `arkived_quote_${slug || 'default'}`;
const MAX = 20;

const read = (slug) => {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(keyFor(slug)) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const write = (slug, items) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(keyFor(slug), JSON.stringify(items.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { slug } }));
  } catch {
    // Non-critical; ignore storage failures.
  }
};

export function getQuoteCart(slug) {
  return read(slug);
}

export function isInQuoteCart(slug, id) {
  return read(slug).some((entry) => entry.id === id);
}

export function addToQuoteCart(slug, item) {
  if (!item?.id) return;
  const existing = read(slug);
  if (existing.some((entry) => entry.id === item.id)) return;
  const entry = {
    id: item.id,
    name: item.name,
    category: item.category || '',
    daily_rate: item.daily_rate ?? 0,
    image: item.images?.find((img) => img.is_primary)?.storage_url || item.images?.[0]?.storage_url || item.image || ''
  };
  write(slug, [...existing, entry]);
}

export function removeFromQuoteCart(slug, id) {
  write(slug, read(slug).filter((entry) => entry.id !== id));
}

export function clearQuoteCart(slug) {
  write(slug, []);
}

export function subscribeQuoteCart(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
