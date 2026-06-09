import cron from 'node-cron';
import { env } from '../config/env.js';
import { notify } from '../lib/notify.js';
import { bookingRepository, equipmentRepository } from '../lib/repositories.js';

const toDateString = (value) => value.toISOString().slice(0, 10);
const addDays = (value, days) => {
  const copy = new Date(value);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

export const runDailyJobs = async (reference = new Date()) => {
  const today = toDateString(reference);
  const tomorrow = toDateString(addDays(reference, 1));

  const [overdueBookings, maintenanceDueToday, reminders] = await Promise.all([
    bookingRepository.markOverdue(today),
    equipmentRepository.listMaintenanceDue(today),
    bookingRepository.listReminderCandidates(tomorrow)
  ]);

  await Promise.all([
    ...overdueBookings.map((booking) => notify.bookingReminder({
      type: 'overdue',
      booking_id: booking.id,
      tenant_id: booking.tenant_id
    })),
    ...maintenanceDueToday.map((log) => notify.maintenanceDue({
      maintenance_log_id: log.id,
      equipment_id: log.equipment_id,
      tenant_id: log.tenant_id,
      due_date: log.next_service_due
    })),
    ...reminders.map((booking) => notify.bookingReminder({
      type: booking.start_date === tomorrow ? 'start_tomorrow' : 'return_tomorrow',
      booking_id: booking.id,
      tenant_id: booking.tenant_id
    }))
  ]);

  return {
    today,
    tomorrow,
    overdueCount: overdueBookings.length,
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
