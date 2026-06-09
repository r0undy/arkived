import { useEffect, useState } from 'react';
import { storefrontApi } from '../lib/api';

const inferSlug = () => {
  const queryTenant = new URLSearchParams(window.location.search).get('tenant');
  if (queryTenant) return queryTenant;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'demo';

  const [first] = host.split('.');
  return first || 'demo';
};

const applyTenantTheme = (tenant) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', tenant.accent_color || '#6366f1');
  root.style.setProperty('--color-primary-hover', tenant.accent_color || '#4f46e5');
};

export const useTenant = () => {
  const [slug, setSlug] = useState(() => inferSlug());
  const [state, setState] = useState({ loading: true, tenant: null, error: '' });

  useEffect(() => {
    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true, error: '' }));

    storefrontApi
      .tenant(slug)
      .then((result) => {
        if (!isMounted) return;
        applyTenantTheme(result.tenant);
        setState({ loading: false, tenant: result.tenant, error: '' });
      })
      .catch((error) => {
        if (!isMounted) return;
        setState({ loading: false, tenant: null, error: error.message });
      });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return {
    ...state,
    slug,
    setSlug(nextSlug) {
      const next = String(nextSlug || '').trim();
      if (!next || next === slug) return;
      const url = new URL(window.location.href);
      url.searchParams.set('tenant', next);
      window.history.replaceState({}, '', url.toString());
      setSlug(next);
    }
  };
};
