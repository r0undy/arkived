import { hasSupabase, supabase } from '../config/supabase.js';
import { inMemoryDb } from './inMemoryDb.js';
import { AppError } from './errors.js';

const ACTIVE_BOOKING_STATUSES = ['reserved', 'payment', 'dispatched'];

const safeSingle = async (queryPromise, notFoundMessage) => {
  const { data, error } = await queryPromise;

  if (error) {
    if (error.code === 'PGRST116') {
      throw new AppError(404, notFoundMessage, 'NOT_FOUND');
    }

    throw new AppError(500, error.message, 'DB_ERROR');
  }

  if (!data) {
    throw new AppError(404, notFoundMessage, 'NOT_FOUND');
  }

  return data;
};

const storagePathFromPublicUrl = (url) => {
  if (!url) return null;
  const marker = '/tenant-assets/';
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return url.slice(index + marker.length);
};

/**
 * A tenant's public storefront is only "published" once the owner has finished
 * the welcome wizard (which writes the `go_live` step). Tenants seeded or
 * created before onboarding existed are treated as live when they already have
 * at least one item to rent, so the demo storefront keeps working.
 */
export function isTenantPublished(tenant, equipmentCount = 0) {
  const steps = Array.isArray(tenant?.onboarding_completed_steps)
    ? tenant.onboarding_completed_steps
    : [];
  return steps.includes('go_live') || equipmentCount > 0;
}

export const tenantRepository = {
  async listPublicTenants() {
    if (!hasSupabase) {
      return inMemoryDb
        .listTenants()
        .map((tenant) => ({
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          logo_url: tenant.logo_url || '',
          accent_color: tenant.accent_color
        }));
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('id, slug, name, logo_url, accent_color')
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, error.message, 'TENANT_LIST_FAILED');
    }

    return data ?? [];
  },

  async getPublicBySlug(slug) {
    if (!hasSupabase) {
      const tenant = inMemoryDb.getTenantBySlug(slug);
      if (!tenant) {
        throw new AppError(404, 'Tenant not found', 'TENANT_NOT_FOUND');
      }
      return tenant;
    }

    return safeSingle(
      supabase
        .from('tenants')
        .select('id, slug, name, logo_url, accent_color, banner_image_url, contact_email, contact_phone, contact_address, show_watermark, tagline, meta_description, favicon_url, og_image_url, business_hours, onboarding_completed_steps')
        .eq('slug', slug)
        .single(),
      'Tenant not found'
    );
  },

  async getById(id) {
    if (!hasSupabase) {
      const tenant = inMemoryDb.getTenantById(id);
      if (!tenant) {
        throw new AppError(404, 'Tenant not found', 'TENANT_NOT_FOUND');
      }
      return tenant;
    }

    return safeSingle(
      supabase
        .from('tenants')
        .select('id, slug, name, logo_url, accent_color, banner_image_url, contact_email, contact_phone, contact_address, show_watermark, tagline, meta_description, favicon_url, og_image_url, business_hours, onboarding_completed_steps')
        .eq('id', id)
        .single(),
      'Tenant not found'
    );
  },

  async registerTenant(payload) {
    if (!hasSupabase) {
      const tenant = inMemoryDb.createTenant(payload);
      if (!tenant) {
        throw new AppError(409, 'Slug is already taken', 'SLUG_CONFLICT');
      }
      return tenant;
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert({
        slug: payload.slug,
        name: payload.name,
        contact_email: payload.email
      })
      .select('id, slug, name, accent_color, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'TENANT_CREATE_FAILED');
    }

    return data;
  },

  async updateBranding(tenantId, payload) {
    if (!hasSupabase) {
      const tenant = inMemoryDb.updateTenant(tenantId, payload);
      if (!tenant) {
        throw new AppError(404, 'Tenant not found', 'TENANT_NOT_FOUND');
      }
      return tenant;
    }

    return safeSingle(
      supabase
        .from('tenants')
        .update(payload)
        .eq('id', tenantId)
        .select('id, slug, name, logo_url, accent_color, banner_image_url, contact_email, contact_phone, contact_address, show_watermark, tagline, meta_description, favicon_url, og_image_url, business_hours, onboarding_completed_steps')
        .single(),
      'Tenant not found'
    );
  }
};

export const staffRepository = {
  async listByTenant(tenantId) {
    if (!hasSupabase) {
      return inMemoryDb.listUsersByTenant(tenantId);
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, role, full_name, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, error.message, 'STAFF_LIST_FAILED');
    }

    return (data ?? []).map((entry) => ({ ...entry, email: null }));
  },

  async create(payload) {
    if (!hasSupabase) {
      const user = inMemoryDb.createUser(payload);
      if (!user) {
        throw new AppError(409, 'Email is already in use', 'STAFF_EMAIL_CONFLICT');
      }
      return user;
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: payload.id,
        tenant_id: payload.tenant_id,
        role: payload.role,
        full_name: payload.full_name
      })
      .select('id, role, full_name, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'STAFF_CREATE_FAILED');
    }

    return { ...data, email: payload.email ?? null };
  },

  async updateRole(tenantId, id, role) {
    if (!hasSupabase) {
      const user = inMemoryDb.updateUserRole(tenantId, id, role);
      if (!user) {
        throw new AppError(404, 'Staff user not found', 'STAFF_NOT_FOUND');
      }
      return user;
    }

    return safeSingle(
      supabase
        .from('users')
        .update({ role })
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .select('id, role, full_name, created_at')
        .single(),
      'Staff user not found'
    );
  },

  async deleteById(tenantId, id) {
    if (!hasSupabase) {
      const removed = inMemoryDb.deleteUser(tenantId, id);
      if (!removed) {
        throw new AppError(404, 'Staff user not found', 'STAFF_NOT_FOUND');
      }
      return removed;
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      throw new AppError(404, 'Staff user not found', 'STAFF_NOT_FOUND');
    }

    return data;
  }
};

export const customerRepository = {
  async list(tenantId, filters = {}) {
    if (!hasSupabase) {
      return inMemoryDb.listCustomers(tenantId, filters);
    }

    let query = supabase
      .from('customers')
      .select('id, tenant_id, full_name, email, phone, notes, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters.q) {
      query = query.or(
        `full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(500, error.message, 'CUSTOMER_LIST_FAILED');
    }
    return data ?? [];
  },

  async create(payload) {
    if (!hasSupabase) {
      return inMemoryDb.createCustomer(payload);
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select('id, tenant_id, full_name, email, phone, notes, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'CUSTOMER_CREATE_FAILED');
    }

    return data;
  },

  async getById(tenantId, id) {
    if (!hasSupabase) {
      const customer = inMemoryDb.getCustomerById(tenantId, id);
      if (!customer) {
        throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
      }
      return customer;
    }

    return safeSingle(
      supabase
        .from('customers')
        .select('id, tenant_id, full_name, email, phone, notes, created_at')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .single(),
      'Customer not found'
    );
  },

  async update(tenantId, id, payload) {
    if (!hasSupabase) {
      const customer = inMemoryDb.updateCustomer(tenantId, id, payload);
      if (!customer) {
        throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
      }
      return customer;
    }

    return safeSingle(
      supabase
        .from('customers')
        .update(payload)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .select('id, tenant_id, full_name, email, phone, notes, created_at')
        .single(),
      'Customer not found'
    );
  },

  async listBookings(tenantId, customerId) {
    if (!hasSupabase) {
      return inMemoryDb.listBookingsByCustomer(tenantId, customerId);
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, overdue, created_at')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message, 'CUSTOMER_BOOKING_LIST_FAILED');
    }

    return data ?? [];
  }
};

export const equipmentRepository = {
  async list(tenantId, filters = {}) {
    if (!hasSupabase) {
      return inMemoryDb.listEquipment(tenantId, filters);
    }

    let query = supabase
      .from('equipment')
      .select('id, name, description, category, daily_rate, deposit, quantity, status, condition, tags, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.q) query = query.ilike('name', `%${filters.q}%`);

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, error.message, 'EQUIPMENT_LIST_FAILED');
    }

    const items = data ?? [];
    if (items.length === 0) {
      return items;
    }

    // Attach images in a single query so storefront cards / dashboard tiles can
    // render a cover photo without an N+1 round-trip per item.
    const { data: images, error: imageError } = await supabase
      .from('equipment_images')
      .select('id, equipment_id, storage_url, is_primary, display_order, created_at')
      .eq('tenant_id', tenantId)
      .in('equipment_id', items.map((item) => item.id))
      .order('display_order', { ascending: true });

    if (imageError) {
      throw new AppError(500, imageError.message, 'EQUIPMENT_LIST_IMAGES_FAILED');
    }

    const imagesByEquipment = new Map();
    for (const image of images ?? []) {
      const bucket = imagesByEquipment.get(image.equipment_id) || [];
      bucket.push(image);
      imagesByEquipment.set(image.equipment_id, bucket);
    }

    return items.map((item) => ({ ...item, images: imagesByEquipment.get(item.id) ?? [] }));
  },

  async getById(tenantId, id) {
    if (!hasSupabase) {
      const item = inMemoryDb.getEquipmentById(tenantId, id);
      if (!item) {
        throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
      }
      return item;
    }

    const item = await safeSingle(
      supabase
        .from('equipment')
        .select('id, name, description, category, daily_rate, deposit, quantity, status, condition, tags, created_at')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .is('deleted_at', null)
        .single(),
      'Equipment not found'
    );

    const { data: images, error: imageError } = await supabase
      .from('equipment_images')
      .select('id, storage_url, is_primary, display_order, created_at')
      .eq('tenant_id', tenantId)
      .eq('equipment_id', id)
      .order('display_order', { ascending: true });

    if (imageError) {
      throw new AppError(500, imageError.message, 'EQUIPMENT_IMAGE_LIST_FAILED');
    }

    return { ...item, images: images ?? [] };
  },

  async create(payload) {
    if (!hasSupabase) {
      return inMemoryDb.createEquipment(payload);
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert(payload)
      .select('id, name, description, category, daily_rate, deposit, quantity, status, condition, tags, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'EQUIPMENT_CREATE_FAILED');
    }

    return data;
  },

  async update(tenantId, id, payload) {
    if (!hasSupabase) {
      const item = inMemoryDb.updateEquipment(tenantId, id, payload);
      if (!item) {
        throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
      }
      return item;
    }

    return safeSingle(
      supabase
        .from('equipment')
        .update(payload)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .is('deleted_at', null)
        .select('id, name, description, category, daily_rate, deposit, quantity, status, condition, tags, created_at')
        .single(),
      'Equipment not found'
    );
  },

  async softDelete(tenantId, id) {
    if (!hasSupabase) {
      const item = inMemoryDb.softDeleteEquipment(tenantId, id);
      if (!item) {
        throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
      }
      return item;
    }

    return safeSingle(
      supabase
        .from('equipment')
        .update({ deleted_at: new Date().toISOString(), status: 'archived' })
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .is('deleted_at', null)
        .select('id, status, deleted_at')
        .single(),
      'Equipment not found'
    );
  },

  async addImage(tenantId, equipmentId, payload) {
    if (!hasSupabase) {
      const image = inMemoryDb.addEquipmentImage(tenantId, equipmentId, payload);
      if (!image) {
        throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
      }
      return image;
    }

    await this.getById(tenantId, equipmentId);

    const { data, error } = await supabase
      .from('equipment_images')
      .insert({
        tenant_id: tenantId,
        equipment_id: equipmentId,
        storage_url: payload.storage_url,
        is_primary: payload.is_primary,
        display_order: payload.display_order
      })
      .select('id, tenant_id, equipment_id, storage_url, is_primary, display_order, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'EQUIPMENT_IMAGE_CREATE_FAILED');
    }

    if (payload.is_primary) {
      const { error: resetError } = await supabase
        .from('equipment_images')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .neq('id', data.id);

      if (resetError) {
        throw new AppError(500, resetError.message, 'EQUIPMENT_IMAGE_PRIMARY_RESET_FAILED');
      }
    }

    return data;
  },

  async removeImage(tenantId, equipmentId, imageId) {
    if (!hasSupabase) {
      const image = inMemoryDb.deleteEquipmentImage(tenantId, equipmentId, imageId);
      if (!image) {
        throw new AppError(404, 'Equipment image not found', 'EQUIPMENT_IMAGE_NOT_FOUND');
      }
      return image;
    }

    const image = await safeSingle(
      supabase
        .from('equipment_images')
        .select('id, storage_url')
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .eq('id', imageId)
        .single(),
      'Equipment image not found'
    );

    const { error: deleteDbError } = await supabase
      .from('equipment_images')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId)
      .eq('id', imageId);

    if (deleteDbError) {
      throw new AppError(500, deleteDbError.message, 'EQUIPMENT_IMAGE_DELETE_FAILED');
    }

    const path = storagePathFromPublicUrl(image.storage_url);
    if (path) {
      const { error: storageError } = await supabase.storage.from('tenant-assets').remove([path]);
      if (storageError) {
        throw new AppError(500, storageError.message, 'EQUIPMENT_IMAGE_STORAGE_DELETE_FAILED');
      }
    }

    return image;
  },

  async setPrimaryImage(tenantId, equipmentId, imageId) {
    if (!hasSupabase) {
      const image = inMemoryDb.setPrimaryEquipmentImage(tenantId, equipmentId, imageId);
      if (!image) {
        throw new AppError(404, 'Equipment image not found', 'EQUIPMENT_IMAGE_NOT_FOUND');
      }
      return image;
    }

    const image = await safeSingle(
      supabase
        .from('equipment_images')
        .select('id, tenant_id, equipment_id, storage_url, is_primary, display_order, created_at')
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .eq('id', imageId)
        .single(),
      'Equipment image not found'
    );

    const { error: resetError } = await supabase
      .from('equipment_images')
      .update({ is_primary: false })
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId);

    if (resetError) {
      throw new AppError(500, resetError.message, 'EQUIPMENT_IMAGE_PRIMARY_RESET_FAILED');
    }

    const { data, error } = await supabase
      .from('equipment_images')
      .update({ is_primary: true })
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId)
      .eq('id', image.id)
      .select('id, tenant_id, equipment_id, storage_url, is_primary, display_order, created_at')
      .single();

    if (error || !data) {
      throw new AppError(500, error?.message || 'Failed to set primary image', 'EQUIPMENT_IMAGE_PRIMARY_SET_FAILED');
    }

    return data;
  },

  async reorderImages(tenantId, equipmentId, imageIds) {
    if (!hasSupabase) {
      const images = inMemoryDb.reorderEquipmentImages(tenantId, equipmentId, imageIds);
      if (!images) {
        throw new AppError(400, 'Invalid image reorder payload', 'EQUIPMENT_IMAGE_REORDER_INVALID');
      }
      return images;
    }

    const { data: current, error: listError } = await supabase
      .from('equipment_images')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId);

    if (listError) {
      throw new AppError(500, listError.message, 'EQUIPMENT_IMAGE_LIST_FAILED');
    }

    const currentIds = new Set((current || []).map((entry) => entry.id));
    if (currentIds.size !== imageIds.length || imageIds.some((id) => !currentIds.has(id))) {
      throw new AppError(400, 'Invalid image reorder payload', 'EQUIPMENT_IMAGE_REORDER_INVALID');
    }

    for (let index = 0; index < imageIds.length; index += 1) {
      const id = imageIds[index];
      const { error } = await supabase
        .from('equipment_images')
        .update({ display_order: index })
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .eq('id', id);

      if (error) {
        throw new AppError(500, error.message, 'EQUIPMENT_IMAGE_REORDER_FAILED');
      }
    }

    const { data, error } = await supabase
      .from('equipment_images')
      .select('id, tenant_id, equipment_id, storage_url, is_primary, display_order, created_at')
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new AppError(500, error.message, 'EQUIPMENT_IMAGE_LIST_FAILED');
    }

    return data ?? [];
  },

  async listMaintenanceLogs(tenantId, equipmentId) {
    if (!hasSupabase) {
      return inMemoryDb.listMaintenanceLogs(tenantId, equipmentId);
    }

    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('id, tenant_id, equipment_id, service_date, service_type, performed_by, notes, cost, next_service_due, created_at')
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId)
      .order('service_date', { ascending: false });

    if (error) {
      throw new AppError(500, error.message, 'MAINTENANCE_LIST_FAILED');
    }

    return data ?? [];
  },

  async listMaintenanceDue(referenceDate) {
    if (!hasSupabase) {
      return inMemoryDb.listMaintenanceDue(referenceDate);
    }

    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('id, tenant_id, equipment_id, service_type, next_service_due, notes, created_at')
      .eq('next_service_due', referenceDate)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, error.message, 'MAINTENANCE_DUE_LIST_FAILED');
    }

    return data ?? [];
  },

  async createMaintenanceLog(payload) {
    if (!hasSupabase) {
      return inMemoryDb.createMaintenanceLog(payload);
    }

    const { data, error } = await supabase
      .from('maintenance_logs')
      .insert(payload)
      .select('id, tenant_id, equipment_id, service_date, service_type, performed_by, notes, cost, next_service_due, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'MAINTENANCE_CREATE_FAILED');
    }

    return data;
  },

  async updateMaintenanceLog(tenantId, equipmentId, logId, payload) {
    if (!hasSupabase) {
      const log = inMemoryDb.updateMaintenanceLog(tenantId, equipmentId, logId, payload);
      if (!log) {
        throw new AppError(404, 'Maintenance log not found', 'MAINTENANCE_NOT_FOUND');
      }
      return log;
    }

    return safeSingle(
      supabase
        .from('maintenance_logs')
        .update(payload)
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .eq('id', logId)
        .select('id, tenant_id, equipment_id, service_date, service_type, performed_by, notes, cost, next_service_due, created_at')
        .single(),
      'Maintenance log not found'
    );
  },

  async deleteMaintenanceLog(tenantId, equipmentId, logId) {
    if (!hasSupabase) {
      const log = inMemoryDb.deleteMaintenanceLog(tenantId, equipmentId, logId);
      if (!log) {
        throw new AppError(404, 'Maintenance log not found', 'MAINTENANCE_NOT_FOUND');
      }
      return log;
    }

    const { data, error } = await supabase
      .from('maintenance_logs')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId)
      .eq('id', logId)
      .select('id')
      .single();

    if (error || !data) {
      throw new AppError(404, 'Maintenance log not found', 'MAINTENANCE_NOT_FOUND');
    }

    return data;
  }
};

export const bookingRepository = {
  async list(tenantId, filters = {}) {
    if (!hasSupabase) {
      return inMemoryDb.listBookings(tenantId, filters);
    }

    let query = supabase
      .from('bookings')
      .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, payment_reference, dispatch_condition, return_condition, overdue, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.equipmentId) query = query.eq('equipment_id', filters.equipmentId);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.start) query = query.gte('end_date', filters.start);
    if (filters.end) query = query.lte('start_date', filters.end);

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, error.message, 'BOOKING_LIST_FAILED');
    }

    return data ?? [];
  },

  async getById(tenantId, id) {
    if (!hasSupabase) {
      const booking = inMemoryDb.getBookingById(tenantId, id);
      if (!booking) {
        throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
      }
      return booking;
    }

    return safeSingle(
      supabase
        .from('bookings')
        .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, deposit_paid, payment_reference, dispatch_condition, return_condition, overdue, created_at')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .single(),
      'Booking not found'
    );
  },

  async listCalendar(tenantId, filters = {}) {
    if (!hasSupabase) {
      return inMemoryDb.listBookingCalendar(tenantId, filters);
    }

    let query = supabase
      .from('bookings')
      .select('id, equipment_id, start_date, end_date, status, overdue')
      .eq('tenant_id', tenantId)
      .order('start_date', { ascending: true });

    if (filters.equipmentId) query = query.eq('equipment_id', filters.equipmentId);
    if (filters.start) query = query.gte('end_date', filters.start);
    if (filters.end) query = query.lte('start_date', filters.end);

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, error.message, 'BOOKING_CALENDAR_FAILED');
    }

    return data ?? [];
  },

  async hasDateOverlap(tenantId, equipmentId, startDate, endDate, excludeBookingId = null) {
    if (!hasSupabase) {
      return inMemoryDb.hasBookingOverlap(tenantId, equipmentId, startDate, endDate, excludeBookingId);
    }

    let query = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('equipment_id', equipmentId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .in('status', ACTIVE_BOOKING_STATUSES);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { count, error } = await query;

    if (error) {
      throw new AppError(500, error.message, 'BOOKING_CONFLICT_CHECK_FAILED');
    }

    return Number(count || 0) > 0;
  },

  async create(payload) {
    if (!hasSupabase) {
      return inMemoryDb.createBooking(payload);
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(payload)
      .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'BOOKING_CREATE_FAILED');
    }

    return data;
  },

  async updateStatus(tenantId, id, status) {
    if (!hasSupabase) {
      const booking = inMemoryDb.updateBooking(tenantId, id, { status });
      if (!booking) {
        throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
      }
      return booking;
    }

    return safeSingle(
      supabase
        .from('bookings')
        .update({ status })
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, overdue, created_at')
        .single(),
      'Booking not found'
    );
  },

  async update(tenantId, id, payload) {
    if (!hasSupabase) {
      const booking = inMemoryDb.updateBooking(tenantId, id, payload);
      if (!booking) {
        throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
      }
      return booking;
    }

    return safeSingle(
      supabase
        .from('bookings')
        .update(payload)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, deposit_paid, payment_reference, dispatch_condition, return_condition, overdue, created_at')
        .single(),
      'Booking not found'
    );
  },

  async markOverdue(referenceDate) {
    if (!hasSupabase) {
      return inMemoryDb.markOverdueBookings(referenceDate);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ overdue: true })
      .lt('end_date', referenceDate)
      .neq('status', 'closed')
      .eq('overdue', false)
      .select('id, tenant_id, equipment_id, customer_id, start_date, end_date, status, overdue, created_at');

    if (error) {
      throw new AppError(500, error.message, 'BOOKING_OVERDUE_UPDATE_FAILED');
    }

    return data ?? [];
  },

  async listReminderCandidates(referenceDate) {
    if (!hasSupabase) {
      return inMemoryDb.listBookingReminderCandidates(referenceDate);
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, tenant_id, equipment_id, customer_id, start_date, end_date, status, total_amount, overdue, created_at')
      .or(`start_date.eq.${referenceDate},end_date.eq.${referenceDate}`)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, error.message, 'BOOKING_REMINDER_LIST_FAILED');
    }

    return data ?? [];
  },

  async listOverdueEscalations(referenceDate, overdueDays = 3) {
    const targetDate = new Date(`${referenceDate}T00:00:00Z`);
    targetDate.setUTCDate(targetDate.getUTCDate() - overdueDays);
    const endDate = targetDate.toISOString().slice(0, 10);

    if (!hasSupabase) {
      return inMemoryDb
        .listAllBookings()
        .filter((booking) => booking.overdue && booking.status !== 'closed' && booking.end_date === endDate)
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, tenant_id, equipment_id, customer_id, start_date, end_date, status, total_amount, overdue, created_at')
      .eq('overdue', true)
      .neq('status', 'closed')
      .eq('end_date', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, error.message, 'BOOKING_OVERDUE_ESCALATION_LIST_FAILED');
    }

    return data ?? [];
  }
};
