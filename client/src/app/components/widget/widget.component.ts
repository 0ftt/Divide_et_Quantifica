import { Component, input, output, HostListener } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  copyOutline,
  gitNetworkOutline,
  pricetagOutline,
  pulseOutline,
  removeOutline,
} from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetBackground, widgetIcon, widgetNameKey } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';

export interface MovePayload {
  id: string;
  x: number;
  y: number;
}

export interface DuplicatePayload {
  id: string;
  currentX: number;
  currentY: number;
}

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, TranslocoModule, ResizeHandleDirective],
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

  typeIcon(): string {
    return widgetIcon(this.widget().type);
  }

  get nameKey(): string {
    return widgetNameKey(this.widget().type);
  }

  priceLabel(): string {
    const p = this.widget().price;
    if (p != null) {
      return p.toFixed(2);
    }
    return this.isUnlisted() ? '0.00' : '400.32';
  }

  private currentPrice(): number {
    const p = this.widget().price;
    return p != null ? p : 400.32;
  }

  private changePct(): number {
    const key = (this.widget().ticker || this.widget().title || '').toUpperCase();
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (h * 31 + key.charCodeAt(i)) % 2000;
    }
    return +(h / 1000 - 1).toFixed(2);
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

  constructor() {
    addIcons({ gitNetworkOutline, copyOutline, removeOutline, closeOutline, pulseOutline, pricetagOutline });
  }

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

  requestLink(event: MouseEvent): void {
    event.stopPropagation();
    this.onLink.emit(this.widget().id);
  }

  toggleMinimize(event: MouseEvent): void {
    event.stopPropagation();
    this.widget().minimize = !this.widget().minimize;
  }

  duplicateWidgetClick(event: MouseEvent): void {
    event.stopPropagation();
    this.onDuplicate.emit({
      id: this.widget().id,
      currentX: this.widget().posX,
      currentY: this.widget().posY,
    });
  }

  private startCloseAnimation(): void {
    this.isClosing = true;
    setTimeout(() => this.onRemove.emit(this.widget().id), 150);
  }

  deleteWidget(event: MouseEvent): void {
    event.stopPropagation();
    this.startCloseAnimation();
  }
}
