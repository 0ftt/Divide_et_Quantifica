import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calculatorOutline,
  closeOutline,
  copyOutline,
  documentTextOutline,
  gitNetworkOutline,
  notificationsOutline,
  removeOutline,
  swapVerticalOutline,
  timeOutline,
} from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetBackground, widgetIcon, widgetNameKey, collectLinkedTickers } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';
import { DragHandleDirective } from '$core/directives/drag-handle.directive';
import { generateCandles } from '$core/charts/chart-data';
import { AssetService } from '$core/services/asset.service';

export interface UtilityDuplicatePayload {
  id: string;
  currentX: number;
  currentY: number;
}

interface NetRow {
  ticker: string;
  price: number;
  delta: number;
}

const NET_REFRESH_SECS = 5;
const PRICE_FETCH_SECS = 60;

@Component({
  selector: 'app-utility-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon, TranslocoModule, ResizeHandleDirective, DragHandleDirective],
  templateUrl: './utility-widget.component.html',
  styleUrls: ['./utility-widget.component.scss'],
})
export class UtilityWidgetComponent implements OnInit, OnDestroy {

  @Input({ required: true }) widget!: WidgetData;

  @Input() zoomLevel = 1;

  @Input() allWidgets: WidgetData[] = [];

  @Input() tabName = '';

  @Output() link = new EventEmitter<string>();

  @Output() duplicate = new EventEmitter<UtilityDuplicatePayload>();

  @Output() remove = new EventEmitter<string>();

  netRows: NetRow[] = [];

  clockTime = '';
  clockDate = '';

  private timer?: ReturnType<typeof setInterval>;
  private assets = inject(AssetService);
  // Prezzo e variazione % reali per ticker, dall'endpoint /assets.
  private prices = new Map<string, number>();
  private changes = new Map<string, number>();
  private pricesSub?: Subscription;
  private priceTimer?: ReturnType<typeof setInterval>;
  private closeCache = new Map<string, number>();

  constructor() {
    addIcons({
      gitNetworkOutline,
      copyOutline,
      removeOutline,
      addOutline,
      closeOutline,
      documentTextOutline,
      swapVerticalOutline,
      notificationsOutline,
      calculatorOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    if (this.widget.type === 'net' || this.widget.type === 'average') {
      // Prezzi reali dal listino, ricaricati periodicamente.
      this.loadPrices();
      this.priceTimer = setInterval(() => this.loadPrices(), PRICE_FETCH_SECS * 1000);
    }
    if (this.widget.type === 'net') {
      this.refreshNet();
      this.timer = setInterval(() => this.refreshNet(), NET_REFRESH_SECS * 1000);
    } else if (this.widget.type === 'clock') {
      this.refreshClock();
      this.timer = setInterval(() => this.refreshClock(), 1000);
    }
  }

  // loadPrices — GET /assets: memorizza prezzo e variazione % di ogni titolo del
  // listino. In caso di errore (es. offline) tiene i valori precedenti.
  private loadPrices(): void {
    this.pricesSub?.unsubscribe();
    this.pricesSub = this.assets.list().subscribe({
      next: (list) => {
        this.prices.clear();
        this.changes.clear();
        for (const a of list) {
          const key = a.ticker.toUpperCase();
          this.prices.set(key, a.price);
          if (a.change !== null && a.change !== undefined) {
            this.changes.set(key, a.change);
          }
        }
        if (this.widget.type === 'net') {
          this.refreshNet();
        }
      },
      error: () => undefined,
    });
  }

  // priceOf — prezzo reale del ticker; per i titoli non quotati (che nel listino
  // non esistono) resta la serie simulata come ripiego.
  private priceOf(ticker: string): number {
    const real = this.prices.get(ticker);
    return real !== undefined ? real : this.lastClose(ticker);
  }

  private refreshClock(): void {
    const now = new Date();
    this.clockTime = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.clockDate = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  ngOnDestroy(): void {
    this.pricesSub?.unsubscribe();
    if (this.priceTimer) {
      clearInterval(this.priceTimer);
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  bg(): string | null {
    return widgetBackground(this.widget);
  }

  get typeIcon(): string {
    return widgetIcon(this.widget.type);
  }

  get nameKey(): string {
    return widgetNameKey(this.widget.type);
  }

  get netTotal(): number {
    return this.netRows.reduce((sum, r) => sum + r.delta, 0);
  }

  get averageSources(): string[] {
    return this.linkedTickers();
  }

  get averageValue(): number | null {
    const tks = this.linkedTickers();
    if (!tks.length) {
      return null;
    }
    const sum = tks.reduce((s, t) => s + this.priceOf(t), 0);
    return sum / tks.length;
  }

  private linkedTickers(): string[] {
    return collectLinkedTickers(this.widget, this.allWidgets);
  }

  private refreshNet(): void {
    const tickers = this.linkedTickers();
    const rows: NetRow[] = [];
    for (const t of tickers) {
      const price = this.priceOf(t);
      // Il listino da' la variazione in percentuale: la si riporta a valore
      // assoluto ricavando il prezzo di riferimento, cosi' il totale e' sommabile.
      const pct = this.changes.get(t) ?? 0;
      const delta = pct ? +(price - price / (1 + pct / 100)).toFixed(2) : 0;
      rows.push({ ticker: t, price, delta });
    }
    this.netRows = rows;
  }

  private lastClose(ticker: string): number {
    const cached = this.closeCache.get(ticker);
    if (cached !== undefined) {
      return cached;
    }
    const candles = generateCandles(ticker);
    const close = candles[candles.length - 1]?.close ?? 0;
    this.closeCache.set(ticker, close);
    return close;
  }

  requestLink(event: MouseEvent): void {
    event.stopPropagation();
    this.link.emit(this.widget.id);
  }

  requestDuplicate(event: MouseEvent): void {
    event.stopPropagation();
    this.duplicate.emit({ id: this.widget.id, currentX: this.widget.posX, currentY: this.widget.posY });
  }

  requestRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(this.widget.id);
  }

  toggleMinimize(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.widget.minimize = !this.widget.minimize;
  }
}
