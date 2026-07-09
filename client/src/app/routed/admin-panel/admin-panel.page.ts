import { Component, OnInit, OnDestroy } from '@angular/core';
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
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonBadge,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  refreshOutline,
  cloudDownloadOutline,
  chevronBackOutline,
  chevronForwardOutline,
  syncOutline,
  peopleOutline,
  listOutline,
  cashOutline,
  settingsOutline,
  searchOutline,
} from 'ionicons/icons';
import { BreadcrumbsComponent } from '$components/breadcrumbs/breadcrumbs.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Asset } from '$shared';
import { AssetService } from '$core/services/asset.service';
import { CreditService, AppRevenue } from '$core/services/credit.service';
import { TransactionService, AssetEvent } from '$core/services/transaction.service';
import { MarketService, MarketStatus } from '$core/services/market.service';
import { tickerSchema } from '$core/validation/forms.schema';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface StackedEvent {
  ticker: string;
  name: string;
  action: 'add' | 'remove';
  actor: string;
  createdAt: string;
  count: number;
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.page.html',
  styleUrls: ['./admin-panel.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    BreadcrumbsComponent,
    TranslocoModule,
  ],
})
export class AdminPanelPage implements OnInit, OnDestroy {

  tab: 'users' | 'assets' | 'finance' | 'system' = 'assets';

  users: User[] = [
    { id: 1, name: 'Giovanni Luca', email: 'giovanni@unipa.it', role: 'Admin' },
    { id: 2, name: 'Mario Rossi', email: 'mario@email.it', role: 'User' },
  ];

  marketAssets: Asset[] = [];
  loadingAssets = false;
  assetError: string | null = null;

  assetSearch = '';
  assetPage = 0;
  readonly pageSize = 8;

  newTicker = '';
  addingAsset = false;
  newTickerError: string | null = null;

  seeding = false;
  seedMsg: string | null = null;

  revenue: AppRevenue = { total: 0, premium: 0, fees: 0 };

  assetEvents: AssetEvent[] = [];

  market: MarketStatus | null = null;
  refreshingMarket = false;
  now = Date.now();
  private clockTimer?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private assetService: AssetService,
    private creditService: CreditService,
    private txService: TransactionService,
    private marketService: MarketService,
    private transloco: TranslocoService,
  ) {
    addIcons({
      trashOutline,
      refreshOutline,
      cloudDownloadOutline,
      chevronBackOutline,
      chevronForwardOutline,
      syncOutline,
      peopleOutline,
      listOutline,
      cashOutline,
      settingsOutline,
      searchOutline,
    });
  }

  ngOnInit(): void {
    this.loadAssets();
    this.creditService.getAppRevenue().subscribe({
      next: (r) => (this.revenue = r),
      error: () => undefined,
    });
    this.loadAssetEvents();
    this.loadMarketStatus();

    this.clockTimer = setInterval(() => (this.now = Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  loadAssets(): void {
    this.loadingAssets = true;
    this.assetError = null;
    this.assetService.list().subscribe({
      next: (assets) => {
        this.marketAssets = assets;
        this.loadingAssets = false;
        this.clampPage();
      },
      error: () => {
        this.assetError = this.transloco.translate('admin.loadError');
        this.loadingAssets = false;
      },
    });
  }

  get filteredAssets(): Asset[] {
    const q = this.assetSearch.trim().toLowerCase();
    if (!q) {
      return this.marketAssets;
    }
    return this.marketAssets.filter(
      (a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAssets.length / this.pageSize));
  }

  get pagedAssets(): Asset[] {
    const start = this.assetPage * this.pageSize;
    return this.filteredAssets.slice(start, start + this.pageSize);
  }

  private clampPage(): void {
    if (this.assetPage > this.totalPages - 1) {
      this.assetPage = this.totalPages - 1;
    }
    if (this.assetPage < 0) {
      this.assetPage = 0;
    }
  }

  onAssetSearch(): void {
    this.assetPage = 0;
  }

  prevPage(): void {
    if (this.assetPage > 0) {
      this.assetPage--;
    }
  }

  nextPage(): void {
    if (this.assetPage < this.totalPages - 1) {
      this.assetPage++;
    }
  }

  createAsset(): void {
    this.newTickerError = null;
    if (this.addingAsset) {
      return;
    }
    const parsed = tickerSchema.safeParse(this.newTicker);
    if (!parsed.success) {
      this.newTickerError = this.transloco.translate('admin.tickerInvalid');
      return;
    }
    const ticker = parsed.data;
    this.addingAsset = true;
    this.assetService.add(ticker).subscribe({
      next: () => {
        this.newTicker = '';
        this.addingAsset = false;
        this.loadAssets();
        this.loadAssetEvents();
      },
      error: () => {
        this.newTickerError = `Ticker "${ticker}" non trovato su Yahoo Finance.`;
        this.addingAsset = false;
      },
    });
  }

  deleteAsset(ticker: string): void {
    this.assetService.remove(ticker).subscribe(() => {
      this.loadAssets();
      this.loadAssetEvents();
    });
  }

  seedPool(): void {
    if (this.seeding) {
      return;
    }
    this.seeding = true;
    this.seedMsg = null;
    this.assetService.seed().subscribe({
      next: (res) => {
        this.seeding = false;
        this.seedMsg = this.transloco.translate('admin.seedDone', { count: res.added });
        this.loadAssets();
        this.loadAssetEvents();
      },
      error: () => {
        this.seeding = false;
        this.seedMsg = this.transloco.translate('admin.seedError');
      },
    });
  }

  loadAssetEvents(): void {
    this.txService.assetEvents().subscribe({
      next: (events) => (this.assetEvents = events),
      error: () => undefined,
    });
  }

  get stackedEvents(): StackedEvent[] {
    const map = new Map<string, StackedEvent>();
    for (const ev of this.assetEvents) {
      const key = `${ev.ticker}|${ev.action}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (ev.createdAt > existing.createdAt) {
          existing.createdAt = ev.createdAt;
          existing.actor = ev.actor;
        }
      } else {
        map.set(key, {
          ticker: ev.ticker,
          name: ev.name,
          action: ev.action,
          actor: ev.actor,
          createdAt: ev.createdAt,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  loadMarketStatus(): void {
    this.marketService.status().subscribe({
      next: (s) => (this.market = s),
      error: () => undefined,
    });
  }

  refreshMarket(): void {
    if (this.refreshingMarket) {
      return;
    }
    this.refreshingMarket = true;
    this.marketService.refreshNow().subscribe({
      next: (s) => {
        this.market = s;
        this.refreshingMarket = false;
        this.loadAssets();
      },
      error: () => (this.refreshingMarket = false),
    });
  }

  get secondsLeft(): number {
    if (!this.market?.nextUpdate) {
      return 0;
    }
    const ms = new Date(this.market.nextUpdate).getTime() - this.now;
    return Math.max(0, Math.floor(ms / 1000));
  }

  get countdownLabel(): string {
    const s = this.secondsLeft;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  get progressFraction(): number {
    const total = (this.market?.intervalMinutes ?? 20) * 60;
    if (!total) {
      return 0;
    }
    return Math.min(1, Math.max(0, 1 - this.secondsLeft / total));
  }

  get ringOffset(): number {
    const circumference = 2 * Math.PI * 42;
    return circumference * (1 - this.progressFraction);
  }

  deleteUser(userId: number): void {
    this.users = this.users.filter((u) => u.id !== userId);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
