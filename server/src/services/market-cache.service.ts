import { queryOne } from '../db/pool';
import { env } from '../config/env';

interface CacheRow {
  data: unknown;
  last_fetched: string;
}

export interface CachedData<T> {
  data: T;
  lastFetched: Date;
  fresh: boolean;
}

export function isFresh(lastFetched: Date): boolean {
  const ttlMs = env.quoteCacheMinutes * 60 * 1000;
  return Date.now() - lastFetched.getTime() < ttlMs;
}

export async function readCache<T>(
  ticker: string,
  timeframe: string,
): Promise<CachedData<T> | null> {
  const row = await queryOne<CacheRow>(
    'select data, last_fetched from market_cache where ticker = $1 and timeframe = $2',
    [ticker.toUpperCase(), timeframe],
  );
  if (!row) {
    return null;
  }
  const lastFetched = new Date(row.last_fetched);
  return { data: row.data as T, lastFetched, fresh: isFresh(lastFetched) };
}

export async function writeCache(
  ticker: string,
  timeframe: string,
  data: unknown,
): Promise<void> {
  await queryOne(
    `insert into market_cache (ticker, timeframe, data, last_fetched)
     values ($1, $2, $3, now())
     on conflict (ticker, timeframe) do update
       set data = excluded.data, last_fetched = now()`,
    [ticker.toUpperCase(), timeframe, JSON.stringify(data)],
  );
}
