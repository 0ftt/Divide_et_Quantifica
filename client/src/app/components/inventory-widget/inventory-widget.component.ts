import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetBackground, DuplicatePayload } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';
import { DragHandleDirective } from '$core/directives/drag-handle.directive';
import { WidgetHeaderComponent } from '$components/widget-header/widget-header.component';
import { PortfolioService } from '$core/services/portfolio.service';

interface InventoryRow {
  ticker: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-inventory-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon, TranslocoModule, ResizeHandleDirective, DragHandleDirective, WidgetHeaderComponent],
  templateUrl: './inventory-widget.component.html',
  styleUrls: ['./inventory-widget.component.scss'],
})
export class InventoryWidgetComponent implements OnInit {

  @Input({ required: true }) widget!: WidgetData;

  @Input() zoomLevel = 1;

  @Output() link = new EventEmitter<string>();

  @Output() duplicate = new EventEmitter<DuplicatePayload>();

  @Output() remove = new EventEmitter<string>();

  private portfolioService = inject(PortfolioService);

  rows: InventoryRow[] = [];
  loading = false;

  search = '';
  page = 0;
  readonly pageSize = 6;

  constructor() {
    addIcons({ searchOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.loadPortfolio();
  }

  private loadPortfolio(): void {
    this.loading = true;
    this.portfolioService.get().subscribe({
      next: (p) => {
        this.rows = p.holdings.map((h) => ({ ticker: h.ticker, quantity: h.quantity, price: h.lastPrice }));
        this.widget.tickers = this.rows.map((r) => r.ticker);
        this.loading = false;
        this.clampPage();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filteredRows(): InventoryRow[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.rows;
    }
    return this.rows.filter((r) => r.ticker.toLowerCase().includes(q));
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get pagedRows(): InventoryRow[] {
    const start = this.page * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  private clampPage(): void {
    this.page = Math.min(Math.max(0, this.page), this.pageCount - 1);
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
    if (this.page < this.pageCount - 1) {
      this.page++;
    }
  }

  bg(): string | null {
    return widgetBackground(this.widget);
  }

  value(row: InventoryRow): number {
    return row.quantity * row.price;
  }

  get total(): number {
    return this.rows.reduce((sum, row) => sum + this.value(row), 0);
  }
}
