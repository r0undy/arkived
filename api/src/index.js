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

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRouter);
app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Arkived API listening on http://localhost:${env.port}`);
});

startDailyScheduler();
