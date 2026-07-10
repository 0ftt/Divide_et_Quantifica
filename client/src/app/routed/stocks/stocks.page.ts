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
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonBadge,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  trashOutline,
  refreshOutline,
  pulseOutline,
  searchOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { BreadcrumbsComponent } from '$components/breadcrumbs/breadcrumbs.component';
import { AssetService } from '$core/services/asset.service';
import { AuthService } from '$core/auth/auth.service';
import { WidgetService } from '$core/services/widget.service';
import { tickerSchema } from '$core/validation/forms.schema';
import { Asset } from '$shared';

@Component({
  selector: 'app-stocks',
  templateUrl: './stocks.page.html',
  styleUrls: ['./stocks.page.scss'],
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
    IonSearchbar,
    BreadcrumbsComponent,
    TranslocoModule,
  ],
})
export class StocksPage implements OnInit {
  private assetService = inject(AssetService);
  private auth = inject(AuthService);
  private widgetService = inject(WidgetService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  assets: Asset[] = [];
  loading = false;
  loadError: string | null = null;

  search = '';
  page = 0;
  readonly pageSize = 10;

  newTicker = '';
  adding = false;
  addError: string | null = null;

  constructor() {
    addIcons({
      addCircleOutline,
      trashOutline,
      refreshOutline,
      pulseOutline,
      searchOutline,
      chevronBackOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    this.loadAssets();
  }

  get isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
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

  loadAssets(): void {
    this.loading = true;
    this.loadError = null;
    this.assetService.list().subscribe({
      next: (list) => {
        this.assets = list;
        this.loading = false;
        this.clampPage();
      },
      error: () => {
        this.loadError = this.transloco.translate('stocks.loadError');
        this.loading = false;
      },
    });
  }

  createWidget(ticker: string): void {
    this.widgetService.pendingStockTicker = ticker;
    this.router.navigate(['/dashboard']);
  }

  addAsset(): void {
    this.addError = null;
    if (this.adding) {
      return;
    }
    const parsed = tickerSchema.safeParse(this.newTicker);
    if (!parsed.success) {
      this.addError = this.transloco.translate('stocks.tickerInvalid');
      return;
    }
    const ticker = parsed.data;
    this.adding = true;
    this.assetService.add(ticker).subscribe({
      next: () => {
        this.newTicker = '';
        this.adding = false;
        this.loadAssets();
      },
      error: () => {
        this.addError = this.transloco.translate('stocks.addError', { ticker });
        this.adding = false;
      },
    });
  }

  removeAsset(ticker: string): void {
    this.assetService.remove(ticker).subscribe(() => this.loadAssets());
  }
}
