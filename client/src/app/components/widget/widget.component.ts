import { Component, input, output, HostListener } from '@angular/core';
import { WidgetData, widgetBackground, DuplicatePayload } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';
import { WidgetHeaderComponent } from '$components/widget-header/widget-header.component';

export interface MovePayload {
  id: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  standalone: true,
  imports: [ResizeHandleDirective, WidgetHeaderComponent],
  host: {
    '[style.left.px]': 'widget().posX',
    '[style.top.px]': 'widget().posY',
    '[class.is-killing]': 'isClosing',
  },
})
export class WidgetComponent {

  widget = input.required<WidgetData>();

  zoomLevel = input<number>(1);

  onRemove = output<string>();

  onDuplicate = output<DuplicatePayload>();

  onMove = output<MovePayload>();

  onLink = output<string>();

  isClosing = false;

  bg(): string | null {
    return widgetBackground(this.widget());
  }

  isUnlisted(): boolean {
    return this.widget().type === 'unlistedStock';
  }

  priceLabel(): string {
    const price = this.widget().price;
    if (price != null) {
      return price.toFixed(2);
    }
    return this.isUnlisted() ? '0.00' : '400.32';
  }

  private currentPrice(): number {
    const price = this.widget().price;
    return price != null ? price : 400.32;
  }

  private changePct(): number {
    const key = (this.widget().ticker || this.widget().title || '').toUpperCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % 2000;
    }
    return +(hash / 1000 - 1).toFixed(2);
  }

  changeDown(): boolean {
    return this.changePct() < 0;
  }

  changeLabel(): string {
    const pct = this.changePct();
    const abs = (this.currentPrice() * pct) / 100;
    return `${abs.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct}%)`;
  }

  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  beginDrag(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }
    const deltaX = (event.clientX - this.lastMouseX) / this.zoomLevel();
    const deltaY = (event.clientY - this.lastMouseY) / this.zoomLevel();

    this.widget().posX += deltaX;
    this.widget().posY += deltaY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    this.onMove.emit({
      id: this.widget().id,
      x: this.widget().posX,
      y: this.widget().posY,
    });
  }

  @HostListener('window:pointerup')
  onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.onMove.emit({
        id: this.widget().id,
        x: this.widget().posX,
        y: this.widget().posY,
      });
    }
  }

  requestClose(): void {
    this.isClosing = true;
    setTimeout(() => this.onRemove.emit(this.widget().id), 150);
  }
}
