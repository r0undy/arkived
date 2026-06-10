import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config/env.js';
import { startDailyScheduler } from './jobs/dailyScheduler.js';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const isAllowedProductionOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const isHttps = url.protocol === 'https:';
    return isHttps && (host === 'arkived.dev' || host.endsWith('.arkived.dev'));
  } catch (_error) {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (env.nodeEnv === 'production') {
    return isAllowedProductionOrigin(origin);
  }

  if (env.corsOrigins.length === 0) {
    return true;
  }

  return env.corsOrigins.includes(origin);
};

const cspConnectSrc = ["'self'"];
if (env.supabaseUrl) {
  cspConnectSrc.push(env.supabaseUrl);
}
if (env.nodeEnv !== 'production') {
  cspConnectSrc.push('http://localhost:*', 'ws://localhost:*');
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://challenges.cloudflare.com'],
      frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: cspConnectSrc
    }
  }
}));
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);
app.use(express.json({ limit: '1mb' }));

// API responses are per-tenant and authenticated; never let a browser or any
// intermediary cache them, otherwise a stale (e.g. empty) list can be served
// after the user has created data.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/health', healthRouter);
app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Arkived API listening on http://localhost:${env.port}`);
});

startDailyScheduler();
