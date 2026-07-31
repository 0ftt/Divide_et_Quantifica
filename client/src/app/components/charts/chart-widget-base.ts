import {
  AfterViewInit,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import * as echarts from 'echarts';
import { TranslocoService } from '@jsverse/transloco';
import { WidgetData, collectLinkedTickers } from '$core/models/widget.model';
import { MarketService } from '$core/services/market.service';
import { Candle, generateCandles } from '$core/charts/chart-data';

export interface DuplicatePayload {
  id: string;
  currentX: number;
  currentY: number;
}

@Directive()
export abstract class ChartWidgetBase implements AfterViewInit, OnDestroy, DoCheck {

  @Input({ required: true }) widget!: WidgetData;

  @Input() zoomLevel = 1;

  @Input() allWidgets: WidgetData[] = [];

  @Input() demoTicker?: string;

  @Output() remove = new EventEmitter<string>();

  @Output() duplicate = new EventEmitter<DuplicatePayload>();

  @Output() link = new EventEmitter<string>();

  @ViewChild('host', { static: false }) host!: ElementRef<HTMLDivElement>;

  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;
  private lastKey = '__init__';
  private transloco = inject(TranslocoService);
  private market = inject(MarketService);

  private candleCache = new Map<string, Candle[]>();
  private pending = new Set<string>();

  protected abstract buildOption(tickers: string[]): unknown;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngDoCheck(): void {
    if (!this.chart) {
      return;
    }
    if (this.renderKey() !== this.lastKey) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }

  protected sourceTickers(): string[] {
    if (this.demoTicker) {
      return [this.demoTicker.toUpperCase()];
    }
    return collectLinkedTickers(this.widget, this.allWidgets);
  }

  private timeframe(): string {
    return this.widget.timeframe || '1d';
  }

  private cacheKey(ticker: string): string {
    return `${ticker}|${this.timeframe()}`;
  }

  private renderKey(): string {
    return `${this.sourceTickers().join(',')}@${this.timeframe()}`;
  }

  protected candlesFor(ticker: string): Candle[] {
    if (this.demoTicker) {
      return generateCandles(ticker);
    }
    return this.candleCache.get(this.cacheKey(ticker)) ?? [];
  }

  private ensureData(tickers: string[]): void {
    for (const ticker of tickers) {
      const key = this.cacheKey(ticker);
      if (this.candleCache.has(key) || this.pending.has(key)) {
        continue;
      }
      this.pending.add(key);
      this.market.history(ticker, this.timeframe()).subscribe({
        next: (h) => {
          this.candleCache.set(key, (h.candles as Candle[]) ?? []);
          this.pending.delete(key);
          this.render();
        },
        error: () => {

          this.candleCache.set(key, generateCandles(ticker));
          this.pending.delete(key);
          this.render();
        },
      });
    }
  }

  private initChart(): void {
    if (!this.host) {
      return;
    }
    this.chart = echarts.init(this.host.nativeElement, undefined, { renderer: 'canvas' });
    this.render();
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(this.host.nativeElement);
  }

  private render(): void {
    const tickers = this.sourceTickers();
    this.lastKey = this.renderKey();

    if (this.demoTicker) {
      const option = tickers.length ? this.buildOption(tickers) : this.emptyOption();
      this.chart?.setOption(option as echarts.EChartsOption, true);
      return;
    }

    this.ensureData(tickers);
    const ready = tickers.filter((t) => this.candlesFor(t).length > 0);
    let option: unknown;
    if (ready.length) {
      option = this.buildOption(ready);
    } else if (tickers.length) {
      option = this.messageOption('widget.loadingChart');
    } else {
      option = this.emptyOption();
    }
    this.chart?.setOption(option as echarts.EChartsOption, true);
  }

  protected refresh(): void {
    this.render();
  }

  protected emptyOption(): unknown {
    return this.messageOption('widget.emptyChart');
  }

  private messageOption(i18nKey: string): unknown {
    return {
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: this.transloco.translate(i18nKey),
          fill: '#64748b',
          fontSize: 12,
        },
      },
    };
  }
}
