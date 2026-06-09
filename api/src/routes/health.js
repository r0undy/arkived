import { Router } from 'express';
import { hasSupabase } from '../config/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    data_source: hasSupabase ? 'supabase' : 'in_memory'
  });
});
