import { query } from '../db/pool';
import { getQuote } from './yahoo.service';
import { env } from '../config/env';

export interface MarketStatus {
  intervalMinutes: number;
  lastUpdate: string | null;
  nextUpdate: string | null;
  running: boolean;
  count: number;
}

let lastUpdate: Date | null = null;
let nextUpdate: Date | null = null;
let running = false;
let lastCount = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function refreshAll(): Promise<void> {
  if (running) {
    return;
  }
  running = true;
  let count = 0;
  try {
    const rows = await query<{ ticker: string }>('select ticker from assets order by ticker');
    for (const { ticker } of rows) {
      try {
        const quote = await getQuote(ticker, true);
        await query('update assets set last_price = $1, updated_at = now() where ticker = $2', [
          quote.price,
          ticker,
        ]);

        await query('insert into price_history (ticker, price) values ($1, $2)', [ticker, quote.price]);
        count++;
      } catch {

      }
      await sleep(150);
    }
    lastUpdate = new Date();
    lastCount = count;
  } catch (err) {
    console.error('Aggiornamento listino fallito:', err);
  } finally {
    running = false;
    nextUpdate = new Date(Date.now() + env.quoteCacheMinutes * 60 * 1000);
  }
}

export function startMarketScheduler(): void {
  const intervalMs = env.quoteCacheMinutes * 60 * 1000;
  nextUpdate = new Date(Date.now() + intervalMs);
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(() => void refreshAll(), intervalMs);
}

export async function refreshNow(): Promise<MarketStatus> {
  await refreshAll();
  return getMarketStatus();
}

export function getMarketStatus(): MarketStatus {
  return {
    intervalMinutes: env.quoteCacheMinutes,
    lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
    nextUpdate: nextUpdate ? nextUpdate.toISOString() : null,
    running,
    count: lastCount,
  };
}
