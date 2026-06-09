const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const request = async (path, { method = 'GET', body } = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
};

export const storefrontApi = {
  tenants: () => request('/api/v1/tenant/public/tenants'),
  tenant: (slug) => request(`/api/v1/tenant/${slug}/public`),
  catalog: (slug) => request(`/api/v1/storefront/${slug}/catalog`),
  equipment: (slug, equipmentId) => request(`/api/v1/storefront/${slug}/catalog/${equipmentId}`),
  equipmentAvailability: (slug, equipmentId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return request(`/api/v1/storefront/${slug}/catalog/${equipmentId}/availability${suffix}`);
  },
  inquiry: (body) => request('/api/v1/bookings/inquiry', { method: 'POST', body })
};
