import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);

export const supabase = hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;
