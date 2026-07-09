export interface Candle {
  date: string;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function seedFromString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 1;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function generateCandles(seed: string, points = 40): Candle[] {
  const rand = seededRandom(seedFromString(seed));
  const candles: Candle[] = [];
  let price = 100 + rand() * 200;

  const start = new Date();
  start.setDate(start.getDate() - points);

  for (let i = 0; i < points; i++) {
    const open = price;
    const drift = (rand() - 0.48) * open * 0.06;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + rand() * open * 0.03;
    const low = Math.min(open, close) - rand() * open * 0.03;
    const volume = Math.round(1_000_000 + rand() * 5_000_000);

    const date = new Date(start);
    date.setDate(start.getDate() + i);

    candles.push({
      date: formatDate(date),
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      low: +Math.max(1, low).toFixed(2),
      high: +high.toFixed(2),
      volume,
    });

    price = close;
  }

  return candles;
}

export function candleDates(candles: Candle[]): string[] {
  return candles.map((c) => c.date);
}

export function candleCloses(candles: Candle[]): number[] {
  return candles.map((c) => c.close);
}

export function candleVolumes(candles: Candle[]): number[] {
  return candles.map((c) => c.volume);
}

export function generatePortfolioSlices(
  seed: string,
  slices = 5,
): { name: string; value: number }[] {
  const rand = seededRandom(seedFromString(seed));
  const labels = ['AAPL', 'MSFT', 'NVDA', 'UNH', 'AMZN', 'GOOG', 'TSLA', 'META'];
  const result: { name: string; value: number }[] = [];

  for (let i = 0; i < Math.min(slices, labels.length); i++) {
    result.push({
      name: labels[i],
      value: +(5 + rand() * 30).toFixed(1),
    });
  }

  return result;
}
