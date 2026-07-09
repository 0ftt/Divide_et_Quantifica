import { AppError } from '../middleware/error';
import { readCache, writeCache } from './market-cache.service';

export interface Quote {
  ticker: string;
  name: string;
  currency: string;
  price: number;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolHit {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0 (DivideEtQuantifica)' };

export const TIMEFRAMES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

function rangeParams(timeframe: string): { range: string; interval: string } {
  switch (timeframe) {
    case '5d':
      return { range: '5d', interval: '30m' };
    case '1mo':
      return { range: '1mo', interval: '1d' };
    case '3mo':
      return { range: '3mo', interval: '1d' };
    case '6mo':
      return { range: '6mo', interval: '1wk' };
    case '1y':
      return { range: '1y', interval: '1wk' };
    case '5y':
      return { range: '5y', interval: '1mo' };
    case '1d':
    default:
      return { range: '1d', interval: '5m' };
  }
}

async function fetchYahooQuote(ticker: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new AppError(502, `Yahoo Finance non raggiungibile (${res.status}).`);
  }
  const data = (await res.json()) as any;
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') {
    throw new AppError(404, `Ticker "${ticker}" non trovato su Yahoo Finance.`);
  }
  return {
    ticker: ticker.toUpperCase(),
    name: meta.longName || meta.shortName || ticker.toUpperCase(),
    currency: meta.currency || 'USD',
    price: Number(meta.regularMarketPrice),
  };
}

async function fetchYahooChart(ticker: string, timeframe: string): Promise<Candle[]> {
  const { range, interval } = rangeParams(timeframe);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new AppError(502, `Yahoo Finance non raggiungibile (${res.status}).`);
  }
  const data = (await res.json()) as any;
  const result = data?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0] ?? {};
  if (!timestamps.length) {
    throw new AppError(404, `Serie storica non disponibile per "${ticker}".`);
  }

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (q.close?.[i] == null) {
      continue;
    }
    candles.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: Number(q.open?.[i] ?? q.close[i]),
      high: Number(q.high?.[i] ?? q.close[i]),
      low: Number(q.low?.[i] ?? q.close[i]),
      close: Number(q.close[i]),
      volume: Number(q.volume?.[i] ?? 0),
    });
  }
  return candles;
}

export async function getQuote(ticker: string, force = false): Promise<Quote> {
  const key = ticker.toUpperCase();
  if (!force) {
    const cached = await readCache<Quote>(key, 'quote');
    if (cached && cached.fresh) {
      return cached.data;
    }
  }
  const quote = await fetchYahooQuote(key);
  await writeCache(key, 'quote', quote);
  return quote;
}

export async function getHistory(
  ticker: string,
  timeframe = '1d',
  force = false,
): Promise<Candle[]> {
  const key = ticker.toUpperCase();
  const cacheKey = `chart:${timeframe}`;
  if (!force) {
    const cached = await readCache<Candle[]>(key, cacheKey);
    if (cached && cached.fresh) {
      return cached.data;
    }
  }
  const candles = await fetchYahooChart(key, timeframe);
  await writeCache(key, cacheKey, candles);
  return candles;
}

export async function searchSymbols(q: string): Promise<SymbolHit[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new AppError(502, `Yahoo Finance non raggiungibile (${res.status}).`);
  }
  const data = (await res.json()) as any;
  const quotes: any[] = Array.isArray(data?.quotes) ? data.quotes : [];
  return quotes
    .filter((item) => item.symbol)
    .map((item) => ({
      ticker: String(item.symbol),
      name: item.shortname || item.longname || item.symbol,
      exchange: item.exchDisp || item.exchange || '',
      type: item.quoteType || '',
    }));
}
