import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonInput,
  IonBadge,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  trashOutline,
  cartOutline,
  addCircleOutline,
  removeCircleOutline,
  refreshOutline,
  pulseOutline,
  searchOutline,
  chevronBackOutline,
  chevronForwardOutline,
  trendingUpOutline,
  receiptOutline,
} from 'ionicons/icons';
import { BreadcrumbsComponent } from '$components/breadcrumbs/breadcrumbs.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { Asset, Candle, OrderRequest } from '$shared';
import { quantitySchema } from '$core/validation/forms.schema';
import { MarketService } from '$core/services/market.service';
import { AssetService } from '$core/services/asset.service';
import { PortfolioService } from '$core/services/portfolio.service';
import { BrokerCartService } from '$core/services/broker-cart.service';
import { CreditService } from '$core/services/credit.service';
import { AuthService } from '$core/auth/auth.service';
import { WidgetService } from '$core/services/widget.service';
import { TransactionService, Transaction } from '$core/services/transaction.service';
import { ModalComponent } from '$components/modal/modal.component';
import {
  MiniHistoryChartComponent,
  HistoryPoint,
} from '$components/charts/mini-history-chart/mini-history-chart.component';

interface Holding {
  ticker: string;
  quantity: number;
}

@Component({
  selector: 'app-broker',
  templateUrl: './broker.page.html',
  styleUrls: ['./broker.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonInput,
    IonBadge,
    ModalComponent,
    MiniHistoryChartComponent,
    BreadcrumbsComponent,
    TranslocoModule,
  ],
})
export class BrokerPage implements OnInit {
  tab: 'terminal' | 'cart' | 'history' = 'terminal';

  activeTab: 'BUY' | 'SELL' = 'BUY';

  orderTicker = '';

  orderQuantity: number | null = null;

  orderError: string | null = null;

  assets: Asset[] = [];
  loading = false;

  private readonly demoAssets: Asset[] = [
    { ticker: 'AAPL', name: 'Apple Inc.', currency: 'USD', price: 189.3 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', currency: 'USD', price: 420.15 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', currency: 'USD', price: 850.1 },
  ];

  search = '';
  page = 0;
  readonly pageSize = 8;

  inventory: Holding[] = [];

  transactions: Transaction[] = [];
  txLoading = false;
  txError: string | null = null;
  txSearch = '';
  txPage = 0;
  readonly txPageSize = 12;

  historyTicker: string | null = null;
  historyLoading = false;
  historyError: string | null = null;
  historyCandles: Candle[] = [];

  get historyPoints(): HistoryPoint[] {
    return this.historyCandles.map((c) => ({ label: c.date, value: c.close }));
  }

  public cart = inject(BrokerCartService);
  checkoutModalOpen = false;

  private creditService = inject(CreditService);
  private assetService = inject(AssetService);
  private portfolioService = inject(PortfolioService);
  private auth = inject(AuthService);
  private widgetService = inject(WidgetService);
  private txService = inject(TransactionService);
  private transloco = inject(TranslocoService);
  private toastCtrl = inject(ToastController);
  credit = 0;

  constructor(private router: Router, private marketService: MarketService) {
    addIcons({
      statsChartOutline,
      trashOutline,
      cartOutline,
      addCircleOutline,
      removeCircleOutline,
      refreshOutline,
      pulseOutline,
      searchOutline,
      chevronBackOutline,
      chevronForwardOutline,
      trendingUpOutline,
      receiptOutline,
    });
  }

  ngOnInit(): void {
    this.loadAssets();
    this.loadPortfolio();
    this.loadTransactions();
  }

  get isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
  }

  loadAssets(): void {
    this.loading = true;
    this.assetService.list().subscribe({
      next: (list) => {
        this.assets = list;
        this.loading = false;
        this.clampPage();
      },
      error: () => {
        this.assets = this.demoAssets;
        this.loading = false;
        this.clampPage();
      },
    });
  }

  private loadPortfolio(): void {
    this.portfolioService.get().subscribe({
      next: (p) => {
        this.inventory = p.holdings.map((h) => ({ ticker: h.ticker, quantity: h.quantity }));
        this.credit = p.credit;
      },
      error: () => {
        this.creditService.getBalance().subscribe({
          next: (b) => (this.credit = b.credit),
          error: () => undefined,
        });
      },
    });
  }

  get filteredAssets(): Asset[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.assets;
    }
    return this.assets.filter(
      (a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAssets.length / this.pageSize));
  }

  get pagedAssets(): Asset[] {
    const start = this.page * this.pageSize;
    return this.filteredAssets.slice(start, start + this.pageSize);
  }

  private clampPage(): void {
    this.page = Math.min(Math.max(0, this.page), this.totalPages - 1);
  }

  onSearch(): void {
    this.page = 0;
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
    }
  }

  placeWidget(ticker: string, event: MouseEvent): void {
    event.stopPropagation();
    this.widgetService.pendingStockTicker = ticker;
    this.router.navigate(['/dashboard']);
  }

  private async showOrderError(err: unknown): Promise<void> {
    const message =
      (err as { error?: { error?: string } })?.error?.error ||
      this.transloco.translate('broker.orderFailed');
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }

  quickBuy(ticker: string): void {
    const price = this.assets.find((a) => a.ticker === ticker)?.price ?? 0;
    this.portfolioService.buy({ ticker, quantity: 1 }).subscribe({
      next: () => {
        this.recordFee(price);
        this.loadPortfolio();
      },
      error: (err) => this.showOrderError(err),
    });
  }

  quickSell(ticker: string): void {
    const price = this.assets.find((a) => a.ticker === ticker)?.price ?? 0;
    this.portfolioService.sell({ ticker, quantity: 1 }).subscribe({
      next: () => {
        this.recordFee(price);
        this.loadPortfolio();
      },
      error: (err) => this.showOrderError(err),
    });
  }

  loadTransactions(): void {
    this.txLoading = true;
    this.txError = null;
    this.txService.list().subscribe({
      next: (list) => {
        this.transactions = list;
        this.txLoading = false;
      },
      error: () => {
        this.txError = this.transloco.translate('history.loadError');
        this.txLoading = false;
      },
    });
  }

  get filteredTransactions(): Transaction[] {
    const q = this.txSearch.trim().toLowerCase();
    if (!q) {
      return this.transactions;
    }
    return this.transactions.filter(
      (t) =>
        (t.ticker ?? '').toLowerCase().includes(q) ||
        (t.note ?? '').toLowerCase().includes(q) ||
        this.typeLabel(t.type).toLowerCase().includes(q),
    );
  }

  get txTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.txPageSize));
  }

  get pagedTransactions(): Transaction[] {
    const start = this.txPage * this.txPageSize;
    return this.filteredTransactions.slice(start, start + this.txPageSize);
  }

  onTxSearch(): void {
    this.txPage = 0;
  }

  txPrevPage(): void {
    if (this.txPage > 0) {
      this.txPage--;
    }
  }

  txNextPage(): void {
    if (this.txPage < this.txTotalPages - 1) {
      this.txPage++;
    }
  }

  typeLabel(type: string): string {
    return this.transloco.translate('history.types.' + type);
  }

  isInflow(t: Transaction): boolean {
    return t.type === 'sell' || t.type === 'recharge';
  }

  selectAsset(ticker: string): void {
    this.orderTicker = ticker;
  }

  addToCart(ticker: string, event: MouseEvent): void {
    event.stopPropagation();
    this.cart.add(ticker);
  }

  get selectedPrice(): number | null {
    const asset = this.assets.find((a) => a.ticker === this.orderTicker);
    return asset ? asset.price : null;
  }

    submitOrder(): void {
    this.orderError = null;
    if (!this.orderTicker) {
      return;
    }
    const parsed = quantitySchema.safeParse(this.orderQuantity);
    if (!parsed.success) {
      this.orderError = this.transloco.translate('broker.qtyInvalid');
      return;
    }
    this.orderQuantity = parsed.data;
    const order: OrderRequest = { ticker: this.orderTicker, quantity: this.orderQuantity };
    const price = this.selectedPrice ?? 0;
    const value = this.orderQuantity * price;
    const call = this.activeTab === 'BUY'
      ? this.portfolioService.buy(order)
      : this.portfolioService.sell(order);

    call.subscribe({
      next: () => {

        if (value > 0) {
          this.recordFee(value);
        }
        this.loadPortfolio();
        this.orderQuantity = null;
      },
      error: (err) => {
        this.orderError = err?.error?.error || this.transloco.translate('broker.orderFailed');
        this.showOrderError(err);
      },
    });
  }

  private recordFee(value: number): void {
    if (value > 0) {
      this.creditService.recordTradeFee(value).subscribe({ error: () => undefined });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  openHistory(ticker: string, event: MouseEvent): void {
    event.stopPropagation();
    this.historyTicker = ticker;
    this.historyLoading = true;
    this.historyError = null;
    this.historyCandles = [];
    this.marketService.history(ticker).subscribe({
      next: (h) => {

        this.historyCandles = h.candles?.length ? h.candles : this.demoCandles(ticker);
        this.historyLoading = false;
      },
      error: () => {

        this.historyCandles = this.demoCandles(ticker);
        this.historyLoading = false;
      },
    });
  }

    private demoCandles(ticker: string): Candle[] {
    const asset = this.assets.find((a) => a.ticker === ticker);
    const endPrice = asset ? asset.price : 100;
    const points = 30;
    const startPrice = endPrice * 0.92;
    const candles: Candle[] = [];
    let prev = startPrice;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);

      const trend = startPrice + (endPrice - startPrice) * t;
      const wave = Math.sin(i * 1.7) * endPrice * 0.015;
      const close = Math.max(0.01, trend + wave);
      const open = prev;
      const day = new Date();
      day.setDate(day.getDate() - (points - 1 - i));
      candles.push({
        date: day.toISOString().slice(0, 10),
        open,
        high: Math.max(open, close) * 1.01,
        low: Math.min(open, close) * 0.99,
        close,
        volume: 0,
      });
      prev = close;
    }
    return candles;
  }

  closeHistory(): void {
    this.historyTicker = null;
  }

  openCheckout(): void {
    if (this.cart.items().length) {
      this.checkoutModalOpen = true;
    }
  }

  closeCheckout(): void {
    this.checkoutModalOpen = false;
  }

  confirmCheckout(): void {
    const lines = this.cart.items();
    if (!lines.length) {
      this.checkoutModalOpen = false;
      return;
    }
    const cartValue = lines.reduce((sum, line) => {
      const asset = this.assets.find((a) => a.ticker === line.ticker);
      return sum + (asset?.price ?? 0) * line.quantity;
    }, 0);
    const orders = lines.map((line) =>
      this.portfolioService.buy({ ticker: line.ticker, quantity: line.quantity }),
    );

    forkJoin(orders).subscribe({
      next: () => {

        if (cartValue > 0) {
          this.recordFee(cartValue);
        }
        this.loadPortfolio();
      },
      error: (err) => {
        this.showOrderError(err);
        this.loadPortfolio();
      },
    });
    this.cart.clear();
    this.checkoutModalOpen = false;
  }
}
