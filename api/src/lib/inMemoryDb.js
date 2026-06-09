import crypto from 'node:crypto';

const now = () => new Date().toISOString();

const state = {
  tenants: [
    {
      id: crypto.randomUUID(),
      slug: 'demo',
      name: 'Demo Rentals',
      logo_url: '',
      accent_color: '#6366f1',
      banner_image_url: '',
      contact_email: 'hello@demo-rentals.test',
      contact_phone: '+63 900 000 0000',
      contact_address: 'Makati, Metro Manila',
      show_watermark: true,
      created_at: now()
    }
  ],
  equipment: [],
  bookings: [],
  customers: []
};

for (let i = 1; i <= 4; i += 1) {
  const id = crypto.randomUUID();
  state.equipment.push({
    id,
    tenant_id: state.tenants[0].id,
    name: `Demo Equipment ${i}`,
    description: `Description for demo equipment ${i}.`,
    category: i % 2 === 0 ? 'Construction' : 'Media & Film',
    daily_rate: 1200 + i * 100,
    deposit: 1000,
    quantity: 1,
    status: 'available',
    condition: 'good',
    tags: ['demo', 'rental'],
    images: [],
    created_at: now(),
    deleted_at: null
  });
}

export const inMemoryDb = {
  listTenants() {
    return state.tenants;
  },
  getTenantBySlug(slug) {
    return state.tenants.find((tenant) => tenant.slug === slug) || null;
  },
  createTenant(payload) {
    const tenant = {
      id: crypto.randomUUID(),
      slug: payload.slug,
      name: payload.name,
      logo_url: '',
      accent_color: '#6366f1',
      banner_image_url: '',
      contact_email: payload.email || '',
      contact_phone: '',
      contact_address: '',
      show_watermark: true,
      created_at: now()
    };
    state.tenants.push(tenant);
    return tenant;
  },
  listEquipment(tenantId) {
    return state.equipment.filter((item) => item.tenant_id === tenantId && !item.deleted_at);
  },
  createEquipment(payload) {
    const item = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: now(),
      deleted_at: null
    };
    state.equipment.push(item);
    return item;
  },
  listBookings(tenantId) {
    return state.bookings.filter((booking) => booking.tenant_id === tenantId);
  },
  createBooking(payload) {
    const booking = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: now(),
      overdue: false
    };
    state.bookings.push(booking);
    return booking;
  }
};
