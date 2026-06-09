import { useEffect, useState } from 'react';
import { storefrontApi } from '../lib/api';

const DEFAULT_LOCAL_TENANT = import.meta.env.VITE_DEFAULT_TENANT_SLUG || 'demo';
const THEME_STYLE_ID = 'tenant-branding-overrides';

const isLocalHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '');

const inferSlug = () => {
  const host = window.location.hostname;
  if (isLocalHost(host)) {
    const queryTenant = new URLSearchParams(window.location.search).get('tenant');
    return normalizeSlug(queryTenant) || DEFAULT_LOCAL_TENANT;
  }

  const [first] = host.split('.');
  return normalizeSlug(first) || DEFAULT_LOCAL_TENANT;
};

const applyTenantTheme = (tenant) => {
  const accent = tenant?.accent_color || '#6366f1';
  let styleTag = document.getElementById(THEME_STYLE_ID);

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = THEME_STYLE_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    :root {
      --color-primary: ${accent};
      --color-primary-hover: ${accent};
    }
  `;
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
      const next = normalizeSlug(nextSlug);
      if (!next || next === slug) return;
      const url = new URL(window.location.href);
      url.searchParams.set('tenant', next);
      window.history.replaceState({}, '', url.toString());
      setSlug(next);
    }
  };
};
