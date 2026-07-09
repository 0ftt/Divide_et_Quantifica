export type ChartWidgetType =
  | 'chartLine'
  | 'chartArea'
  | 'chartBar'
  | 'chartCandlestick'
  | 'chartPie';

export type WidgetType =
  | 'stockInfo'
  | 'unlistedStock'
  | 'connectionHub'
  | 'newsFeed'
  | 'inventory'
  | 'text'
  | 'net'
  | 'average'
  | 'clock'
  | ChartWidgetType;

export const CHART_WIDGET_TYPES: readonly ChartWidgetType[] = [
  'chartLine',
  'chartArea',
  'chartBar',
  'chartCandlestick',
  'chartPie',
];

export const TIMEFRAME_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '1d', label: '1 Giorno' },
  { value: '5d', label: '5 Giorni' },
  { value: '1mo', label: '1 Mese' },
  { value: '3mo', label: '3 Mesi' },
  { value: '6mo', label: '6 Mesi' },
  { value: '1y', label: '1 Anno' },
  { value: '5y', label: '5 Anni' },
];

export interface WidgetData {
  id: string;
  type: WidgetType;
  title: string;

  posX: number;
  posY: number;
  width: number;
  height: number;
  zIndex: number;

  minimize: boolean;
  visible: boolean;

  company?: string;
  connectionID?: string;
  connectedIDs?: string[];

  ticker?: string;
  theme?: string;
  timeframe?: string;
  chartType?: string;
  color?: string;
  opacity?: number;
  source?: string;
  limit?: number;

  tickers?: string[];

  text?: string;

  price?: number;
}

export function isChartWidget(widget: WidgetData): boolean {
  return (CHART_WIDGET_TYPES as readonly string[]).includes(widget.type);
}

export function widgetNameKey(type: WidgetType): string {
  switch (type) {
    case 'stockInfo':
      return 'dashboard.wAzione';
    case 'unlistedStock':
      return 'dashboard.wUnlisted';
    case 'connectionHub':
      return 'dashboard.wLinker';
    case 'chartCandlestick':
      return 'dashboard.wCandle';
    case 'chartLine':
      return 'dashboard.wLine';
    case 'chartArea':
      return 'dashboard.wArea';
    case 'chartBar':
      return 'dashboard.wVolume';
    case 'chartPie':
      return 'dashboard.wPie';
    case 'inventory':
      return 'dashboard.wInventory';
    case 'text':
      return 'dashboard.wText';
    case 'net':
      return 'dashboard.wNet';
    case 'average':
      return 'dashboard.wAverage';
    case 'clock':
      return 'dashboard.wClock';
    default:
      return 'dashboard.wAzione';
  }
}

export function widgetIcon(type: WidgetType): string {
  switch (type) {
    case 'stockInfo':
      return 'pulse-outline';
    case 'unlistedStock':
      return 'pricetag-outline';
    case 'connectionHub':
      return 'git-network-outline';
    case 'chartCandlestick':
      return 'stats-chart-outline';
    case 'chartLine':
      return 'trending-up-outline';
    case 'chartArea':
      return 'analytics-outline';
    case 'chartBar':
      return 'bar-chart-outline';
    case 'chartPie':
      return 'pie-chart-outline';
    case 'inventory':
      return 'wallet-outline';
    case 'text':
      return 'document-text-outline';
    case 'net':
      return 'swap-vertical-outline';
    case 'average':
      return 'calculator-outline';
    case 'clock':
      return 'time-outline';
    default:
      return 'ellipse-outline';
  }
}

export function widgetBackground(w: { color?: string; opacity?: number }): string | null {

  if (w.color == null && w.opacity == null) {
    return null;
  }
  const base = w.color ?? '#0f172a';
  const alpha = (w.opacity ?? 45) / 100;
  const hex = base.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return null;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
