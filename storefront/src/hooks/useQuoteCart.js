import { useCallback, useEffect, useState } from 'react';
import {
  getQuoteCart,
  addToQuoteCart,
  removeFromQuoteCart,
  clearQuoteCart,
  subscribeQuoteCart
} from '../lib/quoteCart';

/**
 * Reactive accessor for the per-tenant quote cart (Frontend Roadmap F5.6).
 * Returns the current items plus bound add/remove/clear helpers.
 */
export function useQuoteCart(slug) {
  const [items, setItems] = useState(() => getQuoteCart(slug));

  useEffect(() => {
    setItems(getQuoteCart(slug));
    return subscribeQuoteCart(() => setItems(getQuoteCart(slug)));
  }, [slug]);

  const add = useCallback((item) => addToQuoteCart(slug, item), [slug]);
  const remove = useCallback((id) => removeFromQuoteCart(slug, id), [slug]);
  const clear = useCallback(() => clearQuoteCart(slug), [slug]);
  const has = useCallback((id) => items.some((entry) => entry.id === id), [items]);

  return { items, count: items.length, add, remove, clear, has };
}
