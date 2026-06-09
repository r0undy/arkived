import { hasSupabase, supabase } from '../config/supabase.js';
import { inMemoryDb } from './inMemoryDb.js';
import { AppError } from './errors.js';

const safeSingle = async (queryPromise, notFoundMessage) => {
  const { data, error } = await queryPromise;
  if (error) {
    throw new AppError(500, error.message, 'DB_ERROR');
  }
  if (!data) {
    throw new AppError(404, notFoundMessage, 'NOT_FOUND');
  }
  return data;
};

export const tenantRepository = {
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
      return inMemoryDb.createTenant(payload);
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
  }
};

export const equipmentRepository = {
  async list(tenantId) {
    if (!hasSupabase) {
      return inMemoryDb.listEquipment(tenantId);
    }

    const { data, error } = await supabase
      .from('equipment')
      .select('id, name, description, category, daily_rate, deposit, quantity, status, condition, tags, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message, 'EQUIPMENT_LIST_FAILED');
    }

    return data ?? [];
  },

  async create(payload) {
    if (!hasSupabase) {
      return inMemoryDb.createEquipment(payload);
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert(payload)
      .select('id, name, category, daily_rate, quantity, status, condition, created_at')
      .single();

    if (error) {
      throw new AppError(400, error.message, 'EQUIPMENT_CREATE_FAILED');
    }

    return data;
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
  }
};
