import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { bookingRepository, equipmentRepository } from '../lib/repositories.js';
import { analyticsDateRangeSchema, bookingVolumeQuerySchema } from '../validators/analytics.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

const DAY_MS = 24 * 60 * 60 * 1000;
const toDate = (value) => new Date(`${value}T00:00:00Z`);
const toYmd = (value) => new Date(value).toISOString().slice(0, 10);
const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const startOfWeek = (date) => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = day.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return new Date(day.getTime() + diff * DAY_MS);
};

const addMonths = (date, amount) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
const addDays = (date, amount) => new Date(date.getTime() + amount * DAY_MS);

const overlapDays = (aStart, aEnd, bStart, bEnd) => {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  if (end < start) return 0;
  return Math.floor((end - start) / DAY_MS) + 1;
};

analyticsRouter.get('/overview', asyncHandler(async (req, res) => {
  const [equipment, bookings] = await Promise.all([
    equipmentRepository.list(req.user.tenant_id),
    bookingRepository.list(req.user.tenant_id)
  ]);

  const activeBookings = bookings.filter((entry) => ['payment', 'dispatched'].includes(entry.status)).length;
  const overdueCount = bookings.filter((entry) => entry.overdue).length;
  const revenueMTD = bookings
    .filter((entry) => entry.status === 'closed')
    .reduce((sum, entry) => sum + Number(entry.total_amount || 0), 0);

  const utilizationRate = equipment.length === 0
    ? 0
    : Math.min(100, Math.round((activeBookings / equipment.length) * 100));

  res.json({
    data: {
      activeBookings,
      overdueCount,
      revenueMTD,
      utilizationRate
    }
  });
}));

analyticsRouter.get('/revenue', asyncHandler(async (req, res) => {
  const now = new Date();
  const firstOfCurrentMonth = startOfMonth(now);
  const months = Array.from({ length: 12 }, (_, index) => addMonths(firstOfCurrentMonth, -11 + index));
  const labels = months.map((month) => toYmd(month).slice(0, 7));
  const seed = Object.fromEntries(labels.map((label) => [label, 0]));

  const bookings = await bookingRepository.list(req.user.tenant_id);
  for (const booking of bookings) {
    if (booking.status !== 'closed') continue;
    const month = String(booking.end_date || booking.start_date || '').slice(0, 7);
    if (!Object.hasOwn(seed, month)) continue;
    seed[month] += Number(booking.total_amount || 0);
  }

  res.json({
    data: labels.map((month) => ({ month, revenue: seed[month] }))
  });
}));

analyticsRouter.get('/revenue-by-category', asyncHandler(async (req, res) => {
  const [equipment, bookings] = await Promise.all([
    equipmentRepository.list(req.user.tenant_id),
    bookingRepository.list(req.user.tenant_id)
  ]);

  const categoryByEquipment = Object.fromEntries(
    equipment.map((item) => [item.id, item.category || 'Uncategorized'])
  );

  const totals = {};
  for (const booking of bookings) {
    if (booking.status !== 'closed') continue;
    const category = categoryByEquipment[booking.equipment_id] || 'Uncategorized';
    totals[category] = (totals[category] || 0) + Number(booking.total_amount || 0);
  }

  res.json({
    data: Object.entries(totals)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
  });
}));

analyticsRouter.get('/top-equipment', asyncHandler(async (req, res) => {
  const [equipment, bookings] = await Promise.all([
    equipmentRepository.list(req.user.tenant_id),
    bookingRepository.list(req.user.tenant_id)
  ]);

  const equipmentById = Object.fromEntries(equipment.map((item) => [item.id, item]));
  const totals = {};

  for (const booking of bookings) {
    if (booking.status !== 'closed') continue;
    totals[booking.equipment_id] = (totals[booking.equipment_id] || 0) + Number(booking.total_amount || 0);
  }

  const data = Object.entries(totals)
    .map(([equipmentId, revenue]) => ({
      equipment_id: equipmentId,
      equipment_name: equipmentById[equipmentId]?.name || equipmentId,
      revenue
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  res.json({ data });
}));

analyticsRouter.get('/utilization', asyncHandler(async (req, res) => {
  const query = analyticsDateRangeSchema.parse(req.query);
  const start = query.start || toYmd(addDays(new Date(), -29));
  const end = query.end || toYmd(new Date());

  const [equipment, bookings] = await Promise.all([
    equipmentRepository.list(req.user.tenant_id),
    bookingRepository.list(req.user.tenant_id, { start, end })
  ]);

  const rangeStart = toDate(start);
  const rangeEnd = toDate(end);
  const totalDays = Math.max(1, Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / DAY_MS) + 1);

  const data = equipment.map((item) => {
    const bookedDays = bookings
      .filter((entry) => entry.equipment_id === item.id)
      .reduce((sum, entry) => {
        const bookingStart = toDate(entry.start_date);
        const bookingEnd = toDate(entry.end_date);
        return sum + overlapDays(bookingStart, bookingEnd, rangeStart, rangeEnd);
      }, 0);

    const utilizationRate = Math.min(100, Math.round((bookedDays / totalDays) * 100));
    return {
      equipment_id: item.id,
      equipment_name: item.name,
      booked_days: bookedDays,
      total_days: totalDays,
      utilization_rate: utilizationRate
    };
  });

  res.json({ data, meta: { start, end } });
}));

analyticsRouter.get('/booking-volume', asyncHandler(async (req, res) => {
  const query = bookingVolumeQuerySchema.parse(req.query);
  const now = new Date();
  const granularity = query.granularity;

  const defaultStart = granularity === 'week'
    ? toYmd(addDays(startOfWeek(now), -77))
    : toYmd(addMonths(startOfMonth(now), -11));
  const start = query.start || defaultStart;
  const end = query.end || toYmd(now);

  const bookings = await bookingRepository.list(req.user.tenant_id);
  const buckets = {};

  for (const booking of bookings) {
    const createdAt = String(booking.created_at || '').slice(0, 10);
    if (!createdAt || createdAt < start || createdAt > end) continue;

    const date = toDate(createdAt);
    const key = granularity === 'week'
      ? toYmd(startOfWeek(date))
      : toYmd(startOfMonth(date)).slice(0, 7);
    buckets[key] = (buckets[key] || 0) + 1;
  }

  const data = Object.entries(buckets)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));

  res.json({ data, meta: { granularity, start, end } });
}));
