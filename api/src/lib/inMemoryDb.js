import crypto from 'node:crypto';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

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
      onboarding_completed_steps: [],
      created_at: now()
    }
  ],
  users: [],
  equipment: [],
  maintenance_logs: [],
  bookings: [],
  customers: []
};

state.users.push({
  id: 'dev-admin',
  tenant_id: state.tenants[0].id,
  role: 'admin',
  full_name: 'Dev Admin',
  email: 'dev-admin@arkived.local',
  created_at: now()
});

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

state.customers.push({
  id: crypto.randomUUID(),
  tenant_id: state.tenants[0].id,
  full_name: 'Demo Customer',
  email: 'customer@demo.test',
  phone: '+63 900 123 4567',
  notes: '',
  created_at: now()
});

state.bookings.push({
  id: crypto.randomUUID(),
  tenant_id: state.tenants[0].id,
  equipment_id: state.equipment[0].id,
  customer_id: state.customers[0].id,
  start_date: today(),
  end_date: today(),
  status: 'reserved',
  total_amount: 1300,
  deposit_paid: false,
  payment_reference: null,
  dispatch_condition: null,
  return_condition: null,
  overdue: false,
  created_at: now()
});

const includesInsensitive = (source, target) =>
  String(source || '').toLowerCase().includes(String(target || '').toLowerCase());

const ACTIVE_BOOKING_STATUSES = ['reserved', 'payment', 'dispatched'];

export const inMemoryDb = {
  listTenants() {
    return state.tenants;
  },

  getTenantBySlug(slug) {
    return state.tenants.find((tenant) => tenant.slug === slug) || null;
  },

  getTenantById(id) {
    return state.tenants.find((tenant) => tenant.id === id) || null;
  },

  createTenant(payload) {
    const existing = this.getTenantBySlug(payload.slug);
    if (existing) {
      return null;
    }

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
      onboarding_completed_steps: [],
      created_at: now()
    };
    state.tenants.push(tenant);
    return tenant;
  },

  updateTenant(tenantId, payload) {
    const index = state.tenants.findIndex((tenant) => tenant.id === tenantId);
    if (index < 0) return null;

    state.tenants[index] = {
      ...state.tenants[index],
      ...payload
    };

    return state.tenants[index];
  },

  listUsersByTenant(tenantId) {
    return state.users.filter((user) => user.tenant_id === tenantId);
  },

  createUser(payload) {
    const emailConflict = state.users.find((user) => user.email && user.email.toLowerCase() === payload.email.toLowerCase());
    if (emailConflict) return null;

    const user = {
      id: payload.id || crypto.randomUUID(),
      tenant_id: payload.tenant_id,
      role: payload.role || 'staff',
      full_name: payload.full_name || '',
      email: payload.email,
      created_at: now()
    };
    state.users.push(user);
    return user;
  },

  updateUserRole(tenantId, id, role) {
    const index = state.users.findIndex((user) => user.tenant_id === tenantId && user.id === id);
    if (index < 0) return null;
    state.users[index] = { ...state.users[index], role };
    return state.users[index];
  },

  deleteUser(tenantId, id) {
    const index = state.users.findIndex((user) => user.tenant_id === tenantId && user.id === id);
    if (index < 0) return null;
    const [removed] = state.users.splice(index, 1);
    return removed;
  },

  listCustomers(tenantId, filters = {}) {
    return state.customers.filter((customer) => {
      if (customer.tenant_id !== tenantId) return false;
      if (!filters.q) return true;

      const query = String(filters.q).toLowerCase();
      const hay = `${customer.full_name || ''} ${customer.email || ''} ${customer.phone || ''}`.toLowerCase();
      return hay.includes(query);
    });
  },

  createCustomer(payload) {
    const customer = {
      id: crypto.randomUUID(),
      tenant_id: payload.tenant_id,
      full_name: payload.full_name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      notes: payload.notes ?? null,
      created_at: now()
    };

    state.customers.push(customer);
    return customer;
  },

  updateCustomer(tenantId, id, payload) {
    const index = state.customers.findIndex((customer) => customer.tenant_id === tenantId && customer.id === id);
    if (index < 0) return null;

    state.customers[index] = {
      ...state.customers[index],
      ...payload
    };

    return state.customers[index];
  },

  listBookingsByCustomer(tenantId, customerId) {
    return state.bookings
      .filter((booking) => booking.tenant_id === tenantId && booking.customer_id === customerId)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  },

  listEquipment(tenantId, filters = {}) {
    return state.equipment.filter((item) => {
      if (item.tenant_id !== tenantId || item.deleted_at) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.q && !includesInsensitive(item.name, filters.q) && !includesInsensitive(item.description, filters.q)) return false;
      return true;
    });
  },

  getEquipmentById(tenantId, id) {
    return state.equipment.find((item) => item.tenant_id === tenantId && item.id === id && !item.deleted_at) || null;
  },

  createEquipment(payload) {
    const item = {
      ...payload,
      images: payload.images || [],
      id: crypto.randomUUID(),
      created_at: now(),
      deleted_at: null
    };
    state.equipment.push(item);
    return item;
  },

  updateEquipment(tenantId, id, payload) {
    const index = state.equipment.findIndex((item) => item.tenant_id === tenantId && item.id === id && !item.deleted_at);
    if (index < 0) return null;

    state.equipment[index] = {
      ...state.equipment[index],
      ...payload
    };

    return state.equipment[index];
  },

  softDeleteEquipment(tenantId, id) {
    const item = this.getEquipmentById(tenantId, id);
    if (!item) return null;

    item.deleted_at = now();
    item.status = 'archived';
    return item;
  },

  addEquipmentImage(tenantId, equipmentId, payload) {
    const item = this.getEquipmentById(tenantId, equipmentId);
    if (!item) return null;

    const images = item.images || [];
    const image = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      equipment_id: equipmentId,
      storage_url: payload.storage_url,
      is_primary: Boolean(payload.is_primary),
      display_order: Number(payload.display_order ?? images.length),
      created_at: now()
    };

    if (image.is_primary) {
      item.images = images.map((entry) => ({ ...entry, is_primary: false }));
      item.images.push(image);
    } else {
      item.images = [...images, image];
    }

    return image;
  },

  getEquipmentImage(tenantId, equipmentId, imageId) {
    const item = this.getEquipmentById(tenantId, equipmentId);
    if (!item) return null;
    return (item.images || []).find((entry) => entry.id === imageId) || null;
  },

  deleteEquipmentImage(tenantId, equipmentId, imageId) {
    const item = this.getEquipmentById(tenantId, equipmentId);
    if (!item) return null;

    const index = (item.images || []).findIndex((entry) => entry.id === imageId);
    if (index < 0) return null;

    const [removed] = item.images.splice(index, 1);
    return removed;
  },

  setPrimaryEquipmentImage(tenantId, equipmentId, imageId) {
    const item = this.getEquipmentById(tenantId, equipmentId);
    if (!item) return null;

    let found = null;
    item.images = (item.images || []).map((entry) => {
      const isPrimary = entry.id === imageId;
      if (isPrimary) found = { ...entry, is_primary: true };
      return { ...entry, is_primary: isPrimary };
    });

    return found;
  },

  reorderEquipmentImages(tenantId, equipmentId, imageIds) {
    const item = this.getEquipmentById(tenantId, equipmentId);
    if (!item) return null;

    const current = item.images || [];
    if (current.length !== imageIds.length) return null;

    const byId = new Map(current.map((entry) => [entry.id, entry]));
    if (imageIds.some((id) => !byId.has(id))) return null;

    item.images = imageIds.map((id, index) => ({ ...byId.get(id), display_order: index }));
    return item.images;
  },

  listMaintenanceLogs(tenantId, equipmentId) {
    return state.maintenance_logs
      .filter((log) => log.tenant_id === tenantId && log.equipment_id === equipmentId)
      .sort((a, b) => String(b.service_date).localeCompare(String(a.service_date)));
  },

  createMaintenanceLog(payload) {
    const log = {
      id: crypto.randomUUID(),
      tenant_id: payload.tenant_id,
      equipment_id: payload.equipment_id,
      service_date: payload.service_date,
      service_type: payload.service_type,
      performed_by: payload.performed_by || null,
      notes: payload.notes || null,
      cost: payload.cost ?? null,
      next_service_due: payload.next_service_due || null,
      created_at: now()
    };

    state.maintenance_logs.push(log);
    return log;
  },

  updateMaintenanceLog(tenantId, equipmentId, logId, payload) {
    const index = state.maintenance_logs.findIndex(
      (log) => log.tenant_id === tenantId && log.equipment_id === equipmentId && log.id === logId
    );

    if (index < 0) return null;

    state.maintenance_logs[index] = {
      ...state.maintenance_logs[index],
      ...payload
    };

    return state.maintenance_logs[index];
  },

  deleteMaintenanceLog(tenantId, equipmentId, logId) {
    const index = state.maintenance_logs.findIndex(
      (log) => log.tenant_id === tenantId && log.equipment_id === equipmentId && log.id === logId
    );

    if (index < 0) return null;

    const [removed] = state.maintenance_logs.splice(index, 1);
    return removed;
  },

  listBookings(tenantId) {
    return state.bookings.filter((booking) => booking.tenant_id === tenantId);
  },

  getBookingById(tenantId, id) {
    return state.bookings.find((booking) => booking.tenant_id === tenantId && booking.id === id) || null;
  },

  listBookingCalendar(tenantId, filters = {}) {
    return state.bookings.filter((booking) => {
      if (booking.tenant_id !== tenantId) return false;
      if (filters.equipmentId && booking.equipment_id !== filters.equipmentId) return false;
      if (filters.start && booking.end_date < filters.start) return false;
      if (filters.end && booking.start_date > filters.end) return false;
      return true;
    });
  },

  hasBookingOverlap(tenantId, equipmentId, startDate, endDate, excludeBookingId = null) {
    return state.bookings.some((booking) => {
      if (booking.tenant_id !== tenantId) return false;
      if (booking.equipment_id !== equipmentId) return false;
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) return false;

      return booking.start_date <= endDate && booking.end_date >= startDate;
    });
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
  },

  updateBooking(tenantId, id, payload) {
    const index = state.bookings.findIndex((booking) => booking.tenant_id === tenantId && booking.id === id);
    if (index < 0) return null;

    state.bookings[index] = {
      ...state.bookings[index],
      ...payload
    };

    return state.bookings[index];
  }
};
