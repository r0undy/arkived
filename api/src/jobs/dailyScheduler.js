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

export const runDailyJobs = async (reference = new Date()) => {
  const today = toDateString(reference);
  const tomorrow = toDateString(addDays(reference, 1));

  const [overdueBookings, overdueEscalations, maintenanceDueToday, reminders] = await Promise.all([
    bookingRepository.markOverdue(today),
    bookingRepository.listOverdueEscalations(today, 3),
    equipmentRepository.listMaintenanceDue(today),
    bookingRepository.listReminderCandidates(tomorrow)
  ]);

  const overdueDay1Notifications = await Promise.all(overdueBookings.flatMap((booking) => [
    (async () => {
      try {
        const customer = await customerRepository.getById(booking.tenant_id, booking.customer_id);
        return notify.bookingReminder({
          type: 'overdue_day1_customer',
          booking_id: booking.id,
          tenant_id: booking.tenant_id,
          to: customer.email || undefined,
          sms_to: customer.phone ? [customer.phone] : []
        });
      } catch (_error) {
        return null;
      }
    })(),
    (async () => {
      try {
        const tenant = await tenantRepository.getById(booking.tenant_id);
        return notify.bookingReminder({
          type: 'overdue_day1_staff',
          booking_id: booking.id,
          tenant_id: booking.tenant_id,
          to: tenant.contact_email || env.resendAdminInbox || undefined,
          sms_to: tenant.contact_phone ? [tenant.contact_phone] : []
        });
      } catch (_error) {
        return null;
      }
    })()
  ]));

  const overdueDay3Notifications = await Promise.all(overdueEscalations.map(async (booking) => {
    try {
      const tenant = await tenantRepository.getById(booking.tenant_id);
      return notify.bookingReminder({
        type: 'overdue_day3_admin',
        booking_id: booking.id,
        tenant_id: booking.tenant_id,
        to: tenant.contact_email || env.resendAdminInbox || undefined
      });
    } catch (_error) {
      return null;
    }
  }));

  const reminderNotifications = await Promise.all(reminders.map(async (booking) => {
    try {
      const customer = await customerRepository.getById(booking.tenant_id, booking.customer_id);
      return notify.bookingReminder({
        type: booking.start_date === tomorrow ? 'start_tomorrow' : 'return_tomorrow',
        booking_id: booking.id,
        tenant_id: booking.tenant_id,
        to: customer.email || undefined
      });
    } catch (_error) {
      return null;
    }
  }));

  await Promise.all([
    ...maintenanceDueToday.map((log) => notify.maintenanceDue({
      maintenance_log_id: log.id,
      equipment_id: log.equipment_id,
      tenant_id: log.tenant_id,
      due_date: log.next_service_due
    })),
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
