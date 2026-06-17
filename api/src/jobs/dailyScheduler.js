import cron from 'node-cron';
import { env } from '../config/env.js';
import { notify } from '../lib/notify.js';
import { bookingRepository, customerRepository, equipmentRepository, tenantRepository } from '../lib/repositories.js';

const toDateString = (value) => value.toISOString().slice(0, 10);
const addDays = (value, days) => {
  const copy = new Date(value);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const formatStorefrontUrl = (tenant) => {
  if (!tenant?.slug) {
    return '';
  }
  return `https://${tenant.slug}.arkived.dev`;
};

const withTenantBranding = (payload, tenant) => ({
  ...payload,
  tenant_name: tenant?.name || 'Arkived',
  tenant_slug: tenant?.slug || '',
  tenant_logo_url: tenant?.logo_url || '',
  tenant_accent_color: tenant?.accent_color || '#6366f1',
  tenant_contact_email: tenant?.contact_email || '',
  tenant_contact_phone: tenant?.contact_phone || '',
  tenant_contact_address: tenant?.contact_address || '',
  storefront_url: formatStorefrontUrl(tenant)
});

export const runDailyJobs = async (reference = new Date()) => {
  const today = toDateString(reference);
  const tomorrow = toDateString(addDays(reference, 1));
  const tenantCache = new Map();
  const equipmentCache = new Map();

  const getTenant = async (tenantId) => {
    if (!tenantId) return null;
    if (tenantCache.has(tenantId)) {
      return tenantCache.get(tenantId);
    }
    const tenant = await tenantRepository.getById(tenantId);
    tenantCache.set(tenantId, tenant);
    return tenant;
  };

  const getEquipmentName = async (tenantId, equipmentId) => {
    if (!tenantId || !equipmentId) return '';
    const key = `${tenantId}:${equipmentId}`;
    if (equipmentCache.has(key)) {
      return equipmentCache.get(key);
    }
    try {
      const equipment = await equipmentRepository.getById(tenantId, equipmentId);
      const name = equipment?.name || '';
      equipmentCache.set(key, name);
      return name;
    } catch (_error) {
      equipmentCache.set(key, '');
      return '';
    }
  };

  const [overdueBookings, overdueEscalations, maintenanceDueToday, reminders] = await Promise.all([
    bookingRepository.markOverdue(today),
    bookingRepository.listOverdueEscalations(today, 3),
    equipmentRepository.listMaintenanceDue(today),
    bookingRepository.listReminderCandidates(tomorrow)
  ]);

  const overdueDay1Notifications = await Promise.all(overdueBookings.flatMap((booking) => [
    (async () => {
      try {
        const [tenant, customer, equipmentName] = await Promise.all([
          getTenant(booking.tenant_id),
          customerRepository.getById(booking.tenant_id, booking.customer_id),
          getEquipmentName(booking.tenant_id, booking.equipment_id)
        ]);
        return notify.bookingReminder(withTenantBranding({
          type: 'overdue_day1_customer',
          booking_id: booking.id,
          tenant_id: booking.tenant_id,
          equipment_name: equipmentName,
          customer_name: customer.full_name || '',
          start_date: booking.start_date,
          end_date: booking.end_date,
          to: customer.email || undefined,
          sms_to: customer.phone ? [customer.phone] : []
        }, tenant));
      } catch (_error) {
        return null;
      }
    })(),
    (async () => {
      try {
        const [tenant, equipmentName] = await Promise.all([
          getTenant(booking.tenant_id),
          getEquipmentName(booking.tenant_id, booking.equipment_id)
        ]);
        return notify.bookingReminder(withTenantBranding({
          type: 'overdue_day1_staff',
          booking_id: booking.id,
          tenant_id: booking.tenant_id,
          equipment_name: equipmentName,
          start_date: booking.start_date,
          end_date: booking.end_date,
          to: tenant.contact_email || env.resendAdminInbox || undefined,
          sms_to: tenant.contact_phone ? [tenant.contact_phone] : []
        }, tenant));
      } catch (_error) {
        return null;
      }
    })()
  ]));

  const overdueDay3Notifications = await Promise.all(overdueEscalations.map(async (booking) => {
    try {
      const [tenant, equipmentName] = await Promise.all([
        getTenant(booking.tenant_id),
        getEquipmentName(booking.tenant_id, booking.equipment_id)
      ]);
      return notify.bookingReminder(withTenantBranding({
        type: 'overdue_day3_admin',
        booking_id: booking.id,
        tenant_id: booking.tenant_id,
        equipment_name: equipmentName,
        start_date: booking.start_date,
        end_date: booking.end_date,
        to: tenant.contact_email || env.resendAdminInbox || undefined
      }, tenant));
    } catch (_error) {
      return null;
    }
  }));

  const reminderNotifications = await Promise.all(reminders.map(async (booking) => {
    try {
      const [tenant, customer, equipmentName] = await Promise.all([
        getTenant(booking.tenant_id),
        customerRepository.getById(booking.tenant_id, booking.customer_id),
        getEquipmentName(booking.tenant_id, booking.equipment_id)
      ]);
      return notify.bookingReminder(withTenantBranding({
        type: booking.start_date === tomorrow ? 'start_tomorrow' : 'return_tomorrow',
        booking_id: booking.id,
        tenant_id: booking.tenant_id,
        equipment_name: equipmentName,
        customer_name: customer.full_name || '',
        start_date: booking.start_date,
        end_date: booking.end_date,
        to: customer.email || undefined
      }, tenant));
    } catch (_error) {
      return null;
    }
  }));

  await Promise.all([
    ...maintenanceDueToday.map(async (log) => {
      const [tenant, equipmentName] = await Promise.all([
        getTenant(log.tenant_id),
        getEquipmentName(log.tenant_id, log.equipment_id)
      ]);
      return notify.maintenanceDue(withTenantBranding({
        maintenance_log_id: log.id,
        equipment_id: log.equipment_id,
        equipment_name: equipmentName,
        tenant_id: log.tenant_id,
        due_date: log.next_service_due
      }, tenant));
    }),
    ...reminderNotifications.filter(Boolean),
    ...overdueDay1Notifications.filter(Boolean),
    ...overdueDay3Notifications.filter(Boolean)
  ]);

  return {
    today,
    tomorrow,
    overdueCount: overdueBookings.length,
    overdueEscalationCount: overdueEscalations.length,
    maintenanceDueCount: maintenanceDueToday.length,
    reminderCount: reminders.length
  };
};

export const startDailyScheduler = () => {
  if (!env.schedulerEnabled || env.nodeEnv === 'test') {
    return null;
  }

  if (env.runDailyJobsOnBoot) {
    runDailyJobs().catch((error) => {
      console.error('Daily scheduler bootstrap run failed', error);
    });
  }

  return cron.schedule('0 2 * * *', () => {
    runDailyJobs().catch((error) => {
      console.error('Daily scheduler run failed', error);
    });
  });
};
