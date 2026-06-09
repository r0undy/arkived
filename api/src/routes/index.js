import { Router } from 'express';
import { authRouter } from './auth.js';
import { bookingsRouter } from './bookings.js';
import { equipmentRouter } from './equipment.js';
import { analyticsRouter } from './analytics.js';
import { tenantRouter } from './tenant.js';
import { storefrontRouter } from './storefront.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/tenant', tenantRouter);
apiRouter.use('/storefront', storefrontRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/analytics', analyticsRouter);
