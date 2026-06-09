import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { bookingRepository, equipmentRepository } from '../lib/repositories.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

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
