import { ChartTimeframe } from './common';

export interface Asset {
  ticker: string;
  name: string;
  currency: string;
  price: number;
  updatedAt?: string;

  change?: number | null;
}

export interface Quote {
  ticker: string;
  name: string;
  currency: string;
  price: number;
}

export interface SymbolHit {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetHistory {
  ticker: string;
  timeframe: ChartTimeframe;
  candles: Candle[];
}
