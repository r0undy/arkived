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
  const [state, setState] = useState({ loading: true, tenant: null, error: '' });

  useEffect(() => {
    const slug = inferSlug();

    storefrontApi
      .tenant(slug)
      .then((result) => {
        applyTenantTheme(result.tenant);
        setState({ loading: false, tenant: result.tenant, error: '' });
      })
      .catch((error) => {
        setState({ loading: false, tenant: null, error: error.message });
      });
  }, []);

  return state;
};
