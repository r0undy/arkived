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

export const tenantRepository = {
  async listPublicTenants() {
    if (!hasSupabase) {
      return inMemoryDb
        .listTenants()
        .map((tenant) => ({ id: tenant.id, slug: tenant.slug, name: tenant.name, accent_color: tenant.accent_color }));
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('id, slug, name, accent_color')
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
        .select('id, slug, name, logo_url, accent_color, banner_image_url, contact_email, contact_phone, contact_address, show_watermark')
        .eq('slug', slug)
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
        .select('id, slug, name, logo_url, accent_color, banner_image_url, contact_email, contact_phone, contact_address, show_watermark')
        .single(),
      'Tenant not found'
    );
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

    return data ?? [];
  },

  async getById(tenantId, id) {
    if (!hasSupabase) {
      const item = inMemoryDb.getEquipmentById(tenantId, id);
      if (!item) {
        throw new AppError(404, 'Equipment not found', 'EQUIPMENT_NOT_FOUND');
      }
      return item;
    }

    return safeSingle(
      supabase
        .from('equipment')
        .select('id, name, description, category, daily_rate, deposit, quantity, status, condition, tags, created_at')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .is('deleted_at', null)
        .single(),
      'Equipment not found'
    );
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
  }
};

export const bookingRepository = {
  async list(tenantId) {
    if (!hasSupabase) {
      return inMemoryDb.listBookings(tenantId);
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, overdue, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

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
        .select('id, equipment_id, customer_id, start_date, end_date, status, total_amount, overdue, created_at')
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
  }
};
