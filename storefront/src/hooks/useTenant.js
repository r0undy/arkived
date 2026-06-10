import { useEffect, useState } from 'react';
import { storefrontApi } from '../lib/api';

const DEFAULT_LOCAL_TENANT = import.meta.env.VITE_DEFAULT_TENANT_SLUG || 'demo';
const THEME_STYLE_ID = 'tenant-branding-overrides';

const isLocalHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '');
const DEV_FORCE_LOCAL_TENANT = normalizeSlug(import.meta.env.VITE_DEV_FORCE_TENANT_SLUG || '');

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

const darkenHex = (hex, amount = 0.1) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r * (1 - amount))}${toHex(rgb.g * (1 - amount))}${toHex(rgb.b * (1 - amount))}`;
};

const inferSlug = () => {
  const host = window.location.hostname;
  if (isLocalHost(host)) {
    if (import.meta.env.DEV && DEV_FORCE_LOCAL_TENANT) {
      return DEV_FORCE_LOCAL_TENANT;
    }
    const queryTenant = new URLSearchParams(window.location.search).get('tenant');
    return normalizeSlug(queryTenant) || DEFAULT_LOCAL_TENANT;
  }

  const [first] = host.split('.');
  return normalizeSlug(first) || DEFAULT_LOCAL_TENANT;
};

const setMetaTag = (selector, attr, value) => {
  if (!value) return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    const [, key, val] = /\[(.+?)="(.+?)"\]/.exec(selector) || [];
    if (key && val) tag.setAttribute(key, val);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
};

const applyFavicon = (tenant) => {
  const href = tenant?.favicon_url || tenant?.logo_url;
  if (!href) return;
  let link = document.head.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;

  let apple = document.head.querySelector('link[rel="apple-touch-icon"]');
  if (!apple) {
    apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    document.head.appendChild(apple);
  }
  apple.href = href;
};

const applyTenantTheme = (tenant) => {
  const accent = tenant?.accent_color || '#6366f1';
  const foreground = primaryForeground(accent);
  const onWhite = contrastRatio(accent, '#ffffff') >= 4.5 ? accent : '#0f172a';
  const hover = darkenHex(accent, 0.1);
  let styleTag = document.getElementById(THEME_STYLE_ID);

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = THEME_STYLE_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    :root {
      --color-primary: ${accent};
      --color-primary-hover: ${hover};
      --color-primary-foreground: ${foreground};
      --color-primary-on-white: ${onWhite};
    }
  `;

  setMetaTag('meta[name="theme-color"]', 'content', accent);
  applyFavicon(tenant);
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
