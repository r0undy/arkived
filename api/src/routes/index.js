import { Router } from 'express';
import { authRouter } from './auth.js';
import { bookingsRouter } from './bookings.js';
import { equipmentRouter } from './equipment.js';
import { analyticsRouter } from './analytics.js';
import { tenantRouter } from './tenant.js';
import { storefrontRouter } from './storefront.js';
import { staffRouter } from './staff.js';
import { customersRouter } from './customers.js';
import { requireAuth } from '../middleware/auth.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
apiRouter.use('/tenant', tenantRouter);
apiRouter.use('/storefront', storefrontRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/staff', staffRouter);
