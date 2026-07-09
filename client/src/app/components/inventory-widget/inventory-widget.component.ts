import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline, copyOutline, gitNetworkOutline, removeOutline, walletOutline } from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetBackground, widgetNameKey } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';

export interface InventoryDuplicatePayload {
  id: string;
  currentX: number;
  currentY: number;
}

interface InventoryRow {
  ticker: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-inventory-widget',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, TranslocoModule, ResizeHandleDirective],
  templateUrl: './inventory-widget.component.html',
  styleUrls: ['./inventory-widget.component.scss'],
})
export class InventoryWidgetComponent implements OnInit {

  @Input({ required: true }) widget!: WidgetData;

  @Input() zoomLevel = 1;

  @Output() link = new EventEmitter<string>();

  @Output() duplicate = new EventEmitter<InventoryDuplicatePayload>();

  @Output() remove = new EventEmitter<string>();

  rows: InventoryRow[] = [
    { ticker: 'AAPL', quantity: 50, price: 214.3 },
    { ticker: 'TSLA', quantity: 12, price: 251.8 },
    { ticker: 'NVDA', quantity: 8, price: 128.6 },
  ];

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor() {
    addIcons({ copyOutline, removeOutline, addOutline, closeOutline, gitNetworkOutline, walletOutline });
  }

  ngOnInit(): void {
    this.widget.tickers = this.rows.map((r) => r.ticker);
  }

  bg(): string | null {
    return widgetBackground(this.widget);
  }

  get nameKey(): string {
    return widgetNameKey(this.widget.type);
  }

  value(row: InventoryRow): number {
    return row.quantity * row.price;
  }

  get total(): number {
    return this.rows.reduce((sum, row) => sum + this.value(row), 0);
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
    this.duplicate.emit({
      id: this.widget.id,
      currentX: this.widget.posX,
      currentY: this.widget.posY,
    });
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
