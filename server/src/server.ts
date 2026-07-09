import { createApp } from './app';
import { env } from './config/env';
import { startMarketScheduler } from './services/market-scheduler.service';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend Divide et Quantifica in ascolto su http://localhost:${env.port}`);

  startMarketScheduler();
});
