import {
  Component,
  EventEmitter,
  HostListener,
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
import { WidgetData, widgetBackground, widgetIcon, widgetNameKey } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';
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
  imports: [CommonModule, FormsModule, IonButton, IonIcon, TranslocoModule, ResizeHandleDirective],
  template: `
    <section class="widget-box util-box" [style.background]="bg()"
             [style.width.px]="widget.width" [style.height.px]="widget.height || null" (pointerdown)="startDrag($event)">
      <header class="widget-header">
        <div class="header-info">
          <ion-icon class="widget-type-icon" [name]="typeIcon"></ion-icon>
          <span class="ticker-name">{{ widget.title || (nameKey | transloco) }}</span>
        </div>
        <div class="widget-controls">
          @if (widget.type === 'net' || widget.type === 'average') {
            <ion-button fill="clear" size="small" class="control-btn" title="Collega" (click)="requestLink($event)">
              <ion-icon slot="icon-only" name="git-network-outline"></ion-icon>
            </ion-button>
          }
          <ion-button fill="clear" size="small" class="control-btn" title="Duplica" (click)="requestDuplicate($event)">
            <ion-icon slot="icon-only" name="copy-outline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" class="control-btn" title="Minimizza" (click)="toggleMinimize($event)">
            <ion-icon slot="icon-only" [name]="widget.minimize ? 'add-outline' : 'remove-outline'"></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" class="control-btn close" title="Chiudi" (click)="requestRemove($event)">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </div>
      </header>

      @if (!widget.minimize) {
        <main class="widget-content util-body" [class.scaled]="!!widget.height" (pointerdown)="$event.stopPropagation()">
          @switch (widget.type) {
            @case ('text') {
              <textarea class="util-text" [(ngModel)]="widget.text" placeholder="Scrivi una nota..."></textarea>
            }
            @case ('net') {
              @if (netRows.length) {
                <div class="net-total" [class.up]="netTotal >= 0" [class.down]="netTotal < 0">
                  {{ netTotal >= 0 ? '+' : '' }}{{ netTotal | number: '1.2-2' }}
                  <span class="net-total-tag">netto</span>
                </div>
                @for (r of netRows; track r.ticker) {
                  <div class="net-row">
                    <span class="net-ticker">{{ r.ticker }}</span>
                    <span class="net-price">\${{ r.price | number: '1.2-2' }}</span>
                    <span class="net-delta" [class.up]="r.delta >= 0" [class.down]="r.delta < 0">
                      {{ r.delta >= 0 ? '▲' : '▼' }} {{ r.delta >= 0 ? '+' : '' }}{{ r.delta | number: '1.2-2' }}
                    </span>
                  </div>
                }
              } @else {
                <p class="util-hint">Collega una o piu' azioni in entrata per vedere il netto.</p>
              }
            }
            @case ('average') {
              @if (averageValue !== null) {
                <div class="net-total">{{ averageValue | number: '1.2-2' }}<span class="net-total-tag">media</span></div>
                <div class="avg-sources">
                  @for (t of averageSources; track t) {
                    <span class="avg-chip">{{ t }}</span>
                  }
                </div>
              } @else {
                <p class="util-hint">Collega una o piu' azioni per calcolarne la media.</p>
              }
            }
            @case ('clock') {
              <div class="clock-time">{{ clockTime }}</div>
              <div class="clock-date">{{ clockDate }}</div>
            }
          }
        </main>
      }
      <div class="resize-handle" appResize [appResizeTarget]="widget" [appResizeZoom]="zoomLevel"></div>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .util-box { min-width: 240px; position: relative; overflow: hidden; display: flex; flex-direction: column; }
      .util-body { padding: 12px; flex: 1 1 auto; min-height: 0; }
      .util-body.scaled {
        container-type: size;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .util-body.scaled .clock-time { font-size: clamp(2.4rem, 26cqmin, 10rem); }
      .util-body.scaled .clock-date { font-size: clamp(0.8rem, 6cqmin, 2rem); }
      .util-body.scaled .net-total { font-size: clamp(1.4rem, 20cqmin, 7rem); }
      .util-body.scaled .net-total-tag { font-size: clamp(0.7rem, 5cqmin, 1.5rem); }
      .util-body.scaled .net-row { font-size: clamp(0.85rem, 6cqmin, 1.8rem); }
      .util-body.scaled .avg-chip { font-size: clamp(0.72rem, 5cqmin, 1.4rem); }
      .util-body.scaled .util-hint { font-size: clamp(0.72rem, 5cqmin, 1.4rem); }
      .util-body.scaled .util-text { flex: 1 1 auto; height: 100%; font-size: clamp(0.85rem, 6cqmin, 1.6rem); }
      .util-text {
        width: 100%;
        min-height: 120px;
        resize: vertical;
        background: color-mix(in srgb, var(--deq-bg-base) 30%, transparent);
        border: 1px solid var(--deq-border);
        border-radius: 6px;
        color: var(--deq-text-main);
        font-size: 0.85rem;
        line-height: 1.4;
        padding: 8px;
        font-family: inherit;
      }
      .util-text:focus { outline: none; border-color: var(--deq-accent-main); }
      .net-total { font-size: 1.4rem; font-weight: 800; text-align: right; margin-bottom: 8px; }
      .net-total-tag { font-size: 0.7rem; color: var(--deq-text-muted); margin-left: 4px; font-weight: 600; }
      .net-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 0;
        border-bottom: 1px solid var(--deq-border);
        font-size: 0.85rem;
      }
      .net-row:last-child { border-bottom: none; }
      .net-ticker { font-weight: 700; color: var(--deq-text-bright); }
      .net-price { color: var(--deq-text-muted); }
      .net-delta { font-weight: 700; font-variant-numeric: tabular-nums; }
      .up { color: var(--deq-success); }
      .down { color: var(--deq-error); }
      .al-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 0.9rem;
      }
      .al-state { font-weight: 700; font-size: 0.8rem; color: var(--deq-text-muted); }
      .al-range { display: flex; gap: 8px; }
      .al-range .util-field { flex: 1; }
      .util-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        text-align: left;
        margin-bottom: 8px;
        font-size: 0.75rem;
        color: var(--deq-text-muted);
      }
      .util-field input {
        background: color-mix(in srgb, var(--deq-bg-base) 30%, transparent);
        border: 1px solid var(--deq-border);
        border-radius: 6px;
        color: var(--deq-text-bright);
        font-size: 0.9rem;
        padding: 6px 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .util-field input:focus { outline: none; border-color: var(--deq-accent-main); }
      .util-hint { margin: 8px 0 0; font-size: 0.72rem; color: var(--deq-text-muted); }
      .avg-sources { display: flex; flex-wrap: wrap; gap: 5px; }
      .avg-chip {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--deq-accent-neon);
        background: color-mix(in srgb, var(--deq-accent-neon) 12%, transparent);
        border-radius: 5px;
        padding: 2px 6px;
      }
      .clock-time {
        font-size: 2.4rem;
        font-weight: 800;
        text-align: center;
        letter-spacing: 2px;
        font-variant-numeric: tabular-nums;
        color: var(--deq-text-bright);
      }
      .clock-date {
        text-align: center;
        font-size: 0.8rem;
        color: var(--deq-text-muted);
        text-transform: capitalize;
        margin-top: 2px;
      }
    `,
  ],
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
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
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
    const out = new Set<string>();

    const visited = new Set<string>([this.widget.id]);
    const collect = (w?: WidgetData) => {
      if (!w || visited.has(w.id)) {
        return;
      }
      visited.add(w.id);
      if (w.type === 'stockInfo' || w.type === 'unlistedStock') {
        const t = (w.ticker || w.title || '').toUpperCase();
        if (t) {
          out.add(t);
        }
      } else if (w.type === 'inventory') {
        for (const t of w.tickers ?? []) {
          if (t) {
            out.add(t.toUpperCase());
          }
        }
      } else if (w.type === 'connectionHub') {
        for (const sid of w.connectedIDs ?? []) {
          collect(this.allWidgets.find((x) => x.id === sid));
        }
      }
    };
    for (const id of this.widget.connectedIDs ?? []) {
      collect(this.allWidgets.find((x) => x.id === id));
    }
    return [...out];
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

  startDrag(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onMouseMove(event: PointerEvent): void {
    if (!this.isDragging) {
      return;
    }
    this.widget.posX += (event.clientX - this.lastX) / this.zoomLevel;
    this.widget.posY += (event.clientY - this.lastY) / this.zoomLevel;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  onMouseUp(): void {
    this.isDragging = false;
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
