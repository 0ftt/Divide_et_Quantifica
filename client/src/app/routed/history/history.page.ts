import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, searchOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { BreadcrumbsComponent } from '$components/breadcrumbs/breadcrumbs.component';
import { TransactionService, Transaction } from '$core/services/transaction.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonIcon,
    BreadcrumbsComponent,
    TranslocoModule,
  ],
})
export class HistoryPage implements OnInit {
  private txService = inject(TransactionService);
  private transloco = inject(TranslocoService);

  transactions: Transaction[] = [];
  loading = false;
  error: string | null = null;

  search = '';
  page = 0;
  readonly pageSize = 12;

  constructor() {
    addIcons({ refreshOutline, searchOutline, chevronBackOutline, chevronForwardOutline });
  }

  get filteredTransactions(): Transaction[] {
    const q = this.search.trim().toLowerCase();
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }

  get pagedTransactions(): Transaction[] {
    const start = this.page * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
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

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.txService.list().subscribe({
      next: (list) => {
        this.transactions = list;
        this.loading = false;
      },
      error: () => {
        this.error = this.transloco.translate('history.loadError');
        this.loading = false;
      },
    });
  }

  typeLabel(type: string): string {
    return this.transloco.translate('history.types.' + type);
  }

  isInflow(t: Transaction): boolean {
    return t.type === 'sell' || t.type === 'recharge';
  }
}
