import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  console.warn(`Missing env vars: ${missing.join(', ')}. API will run with in-memory fallback.`);
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  schedulerEnabled: String(process.env.SCHEDULER_ENABLED || 'true') !== 'false',
  runDailyJobsOnBoot: String(process.env.RUN_DAILY_JOBS_ON_BOOT || 'true') !== 'false',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendEnabled: String(process.env.RESEND_ENABLED || 'true') !== 'false',
  resendFrom: process.env.RESEND_FROM || 'onboarding@resend.dev',
  resendReplyTo: process.env.RESEND_REPLY_TO || '',
  resendDevInbox: process.env.RESEND_DEV_INBOX || 'delivered@resend.dev',
  resendAdminInbox: process.env.RESEND_ADMIN_INBOX || '',
  resendTestMode: String(process.env.RESEND_TEST_MODE || (nodeEnv !== 'production' ? 'true' : 'false')) !== 'false',
  twilioEnabled: String(process.env.TWILIO_ENABLED || 'false') === 'true',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFrom: process.env.TWILIO_FROM || '',
  twilioSmsTo: (process.env.TWILIO_SMS_TO || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
};
