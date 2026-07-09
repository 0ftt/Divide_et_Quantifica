export const FINANCE_PALETTE: readonly string[] = [
  '#2E7D32',
  '#C62828',
  '#1565C0',
  '#F9A825',
  '#6A1B9A',
  '#00838F',
  '#EF6C00',
  '#558B2F',
  '#AD1457',
  '#283593',
];

export const PRICE_COLORS = {
  up: '#2E7D32',
  down: '#C62828',
  neutral: '#90A4AE',
} as const;

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function hexToChannels(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function channelsToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clampChannel(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function randomizeHex(baseHex: string, spread = 45): string {
  const [r, g, b] = hexToChannels(baseHex);
  const jitter = () => Math.round((Math.random() - 0.5) * 2 * spread);
  return channelsToHex(r + jitter(), g + jitter(), b + jitter());
}

export function getSeriesColors(count: number): string[] {
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    if (i < FINANCE_PALETTE.length) {
      colors.push(FINANCE_PALETTE[i]);
    } else {
      const base =
        FINANCE_PALETTE[Math.floor(Math.random() * FINANCE_PALETTE.length)];
      colors.push(randomizeHex(base));
    }
  }

  return colors;
}
