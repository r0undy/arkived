import { useEffect, useState } from 'react';
import { storefrontApi } from '../lib/api';

const DEFAULT_LOCAL_TENANT = import.meta.env.VITE_DEFAULT_TENANT_SLUG || 'demo';
const THEME_STYLE_ID = 'tenant-branding-overrides';

const isLocalHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '');

const hexToRgb = (hex) => {
  const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!match) return null;
  const value = match[1];
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
};

const linearize = (channel) => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const contrastRatio = (hexA, hexB) => {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;

  const lA = 0.2126 * linearize(rgbA.r) + 0.7152 * linearize(rgbA.g) + 0.0722 * linearize(rgbA.b);
  const lB = 0.2126 * linearize(rgbB.r) + 0.7152 * linearize(rgbB.g) + 0.0722 * linearize(rgbB.b);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
};

const primaryForeground = (accent) => (
  contrastRatio(accent, '#ffffff') >= 4.5 ? '#ffffff' : '#0f172a'
);

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
  const foreground = primaryForeground(accent);
  const onWhite = contrastRatio(accent, '#ffffff') >= 4.5 ? accent : '#0f172a';
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
      --color-primary-foreground: ${foreground};
      --color-primary-on-white: ${onWhite};
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
