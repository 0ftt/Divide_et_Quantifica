import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { api } from './routes/api.routes';
import { errorHandler } from './middleware/error';

export function createApp() {
  const app = express();

  const configured = Array.isArray(env.corsOrigin) ? env.corsOrigin : [env.corsOrigin];
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigin === '*' || configured.includes(origin)) {
          return callback(null, true);
        }
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', api);
  app.use(errorHandler);

  return app;
}
