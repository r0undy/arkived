/**
 * Recently-viewed equipment tracking (Frontend Roadmap F5.6).
 * Stored per-tenant in localStorage; purely a browsing aid, no PII.
 */
const keyFor = (slug) => `arkived_recent_${slug || 'default'}`;
const MAX = 8;

export function recordRecentlyViewed(slug, item) {
  if (typeof window === 'undefined' || !item?.id) return;
  try {
    const key = keyFor(slug);
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = {
      id: item.id,
      name: item.name,
      category: item.category,
      daily_rate: item.daily_rate,
      image: item.images?.[0]?.storage_url || ''
    };
    const next = [entry, ...existing.filter((e) => e.id !== item.id)].slice(0, MAX);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Non-critical; ignore storage failures.
  }
}

export function getRecentlyViewed(slug, excludeId = '') {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(keyFor(slug)) || '[]');
    return list.filter((e) => e.id !== excludeId);
  } catch {
    return [];
  }
}
