import { Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { getQuote, getHistory, searchSymbols, TIMEFRAMES } from '../services/yahoo.service';
import { AppError } from '../middleware/error';

interface AssetRow {
  ticker: string;
  name: string;
  currency: string;
  last_price: string;
  updated_at: string;
}

interface AssetRowWithRef extends AssetRow {
  ref_24h: string | null;
  ref_oldest: string | null;
}

function toPublicAsset(a: AssetRow) {
  return {
    ticker: a.ticker,
    name: a.name,
    currency: a.currency,
    price: Number(a.last_price),
    updatedAt: a.updated_at,
  };
}

function changePct(a: AssetRowWithRef): number | null {
  const ref = a.ref_24h ?? a.ref_oldest;
  const refNum = ref !== null ? Number(ref) : NaN;
  if (!refNum || !Number.isFinite(refNum)) {
    return null;
  }
  return +(((Number(a.last_price) - refNum) / refNum) * 100).toFixed(2);
}

function wantsForce(req: Request): boolean {
  return req.query.force === '1' || req.query.force === 'true';
}

const tickerSchema = z
  .string()
  .trim()
  .min(1)
  .max(15)
  .regex(/^[A-Za-z0-9.\-]+$/, 'Ticker non valido.');

const addSchema = z.object({ ticker: tickerSchema });

const searchQuerySchema = z.object({ q: z.string().trim().min(1).max(50) });

const historyQuerySchema = z.object({
  timeframe: z.enum(TIMEFRAMES).default('1d'),
  force: z
    .union([z.literal('1'), z.literal('true')])
    .optional()
    .transform((v) => v !== undefined),
});

export async function listAssets(_req: Request, res: Response): Promise<void> {
  const rows = await query<AssetRowWithRef>(
    `select a.*,
       (select ph.price from price_history ph
          where ph.ticker = a.ticker and ph.recorded_at <= now() - interval '24 hours'
          order by ph.recorded_at desc limit 1) as ref_24h,
       (select ph.price from price_history ph
          where ph.ticker = a.ticker
          order by ph.recorded_at asc limit 1) as ref_oldest
     from assets a
     order by a.ticker asc`,
  );
  res.json(rows.map((r) => ({ ...toPublicAsset(r), change: changePct(r) })));
}

export async function searchAssets(req: Request, res: Response): Promise<void> {
  const { q } = searchQuerySchema.parse(req.query);
  const hits = await searchSymbols(q);
  res.json(hits);
}

export async function addAsset(req: Request, res: Response): Promise<void> {
  const { ticker } = addSchema.parse(req.body);
  const quote = await getQuote(ticker);

  const rows = await query<AssetRow>(
    `insert into assets (ticker, name, currency, last_price, updated_at, added_by)
     values ($1, $2, $3, $4, now(), $5)
     on conflict (ticker) do update
       set name = excluded.name,
           currency = excluded.currency,
           last_price = excluded.last_price,
           updated_at = now()
     returning *`,
    [quote.ticker, quote.name, quote.currency, quote.price, req.user!.sub],
  );

  await query(
    `insert into asset_events (ticker, name, action, actor_id, actor_name)
     values ($1, $2, 'add', $3, $4)`,
    [rows[0].ticker, rows[0].name, req.user!.sub, req.user!.email ?? ''],
  );

  res.status(201).json(toPublicAsset(rows[0]));
}

export async function removeAsset(req: Request, res: Response): Promise<void> {
  const ticker = tickerSchema.parse(req.params.ticker).toUpperCase();
  const existing = await queryOne<AssetRow>('select * from assets where ticker = $1', [ticker]);
  if (!existing) {
    throw new AppError(404, 'Asset non trovato.');
  }
  await query('delete from assets where ticker = $1', [ticker]);

  await query(
    `insert into asset_events (ticker, name, action, actor_id, actor_name)
     values ($1, $2, 'remove', $3, $4)`,
    [existing.ticker, existing.name, req.user!.sub, req.user!.email ?? ''],
  );

  res.json({ message: `Asset ${ticker} rimosso.` });
}

interface AssetEventRow {
  id: string;
  ticker: string;
  name: string;
  action: 'add' | 'remove';
  actor_name: string;
  created_at: string;
}

export async function listAssetEvents(_req: Request, res: Response): Promise<void> {
  const rows = await query<AssetEventRow>(
    `select id, ticker, name, action, actor_name, created_at
       from asset_events
      order by created_at desc
      limit 200`,
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      ticker: r.ticker,
      name: r.name,
      action: r.action,
      actor: r.actor_name,
      createdAt: r.created_at,
    })),
  );
}

const SEED_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B', 'JPM', 'V',
  'MA', 'UNH', 'JNJ', 'WMT', 'PG', 'HD', 'XOM', 'CVX', 'KO', 'PEP',
  'MCD', 'DIS', 'NFLX', 'ADBE', 'CRM', 'INTC', 'AMD', 'CSCO', 'ORCL', 'IBM',
  'BA', 'NKE', 'PFE', 'ABBV', 'BAC', 'WFC', 'GS', 'COST', 'T', 'VZ',
];

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function seedAssets(req: Request, res: Response): Promise<void> {
  const added: string[] = [];
  const failed: string[] = [];

  for (const ticker of SEED_TICKERS) {
    try {
      const quote = await getQuote(ticker);
      await query(
        `insert into assets (ticker, name, currency, last_price, updated_at, added_by)
         values ($1, $2, $3, $4, now(), $5)
         on conflict (ticker) do update
           set name = excluded.name,
               currency = excluded.currency,
               last_price = excluded.last_price,
               updated_at = now()`,
        [quote.ticker, quote.name, quote.currency, quote.price, req.user!.sub],
      );
      added.push(quote.ticker);
    } catch {
      failed.push(ticker);
    }
    await sleep(120);
  }

  if (added.length) {
    await query(
      `insert into asset_events (ticker, name, action, actor_id, actor_name)
       values ($1, $2, 'add', $3, $4)`,
      ['(seed)', `Popolamento iniziale: ${added.length} azioni`, req.user!.sub, req.user!.email ?? ''],
    );
  }

  res.json({ added: added.length, failed });
}

export async function refreshQuote(req: Request, res: Response): Promise<void> {
  const ticker = tickerSchema.parse(req.params.ticker).toUpperCase();
  const quote = await getQuote(ticker, wantsForce(req));
  await query('update assets set last_price = $1, updated_at = now() where ticker = $2', [
    quote.price,
    ticker,
  ]);
  res.json(quote);
}

export async function assetHistory(req: Request, res: Response): Promise<void> {
  const ticker = tickerSchema.parse(req.params.ticker).toUpperCase();
  const { timeframe, force } = historyQuerySchema.parse(req.query);
  const candles = await getHistory(ticker, timeframe, force);
  res.json({ ticker, timeframe, candles });
}
