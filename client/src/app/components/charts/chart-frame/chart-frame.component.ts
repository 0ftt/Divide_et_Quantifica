import {
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  analyticsOutline,
  barChartOutline,
  closeOutline,
  copyOutline,
  gitNetworkOutline,
  pieChartOutline,
  removeOutline,
  statsChartOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetBackground, widgetIcon, widgetNameKey } from '$core/models/widget.model';
import { DuplicatePayload } from '../chart-widget-base';

const MIN_W = 260;
const MIN_H = 200;

@Component({
  selector: 'app-chart-frame',
  standalone: true,
  imports: [IonButton, IonIcon, TranslocoModule],
  templateUrl: './chart-frame.component.html',
  styleUrls: ['./chart-frame.component.scss'],
})
export class ChartFrameComponent {

  @Input({ required: true }) widget!: WidgetData;

  bg(): string | null {
    return widgetBackground(this.widget);
  }

  @Input() zoomLevel = 1;

  get icon(): string {
    return widgetIcon(this.widget.type);
  }

  get nameKey(): string {
    return widgetNameKey(this.widget.type);
  }

  @Output() remove = new EventEmitter<string>();

  @Output() duplicate = new EventEmitter<DuplicatePayload>();

  @Output() link = new EventEmitter<string>();

  private dragging = false;
  private resizing = false;
  private lastX = 0;
  private lastY = 0;

  constructor() {
    addIcons({
      copyOutline,
      removeOutline,
      closeOutline,
      addOutline,
      gitNetworkOutline,

      statsChartOutline,
      trendingUpOutline,
      analyticsOutline,
      barChartOutline,
      pieChartOutline,
    });
  }

  @HostBinding('style.width.px') get hostWidth(): number {
    return this.widget?.width || 380;
  }

  get bodyHeight(): number {
    return this.widget?.height || 300;
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    event.preventDefault();
  }

  startResize(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.resizing = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onMouseMove(event: PointerEvent): void {
    if (!this.dragging && !this.resizing) {
      return;
    }
    const dx = (event.clientX - this.lastX) / this.zoomLevel;
    const dy = (event.clientY - this.lastY) / this.zoomLevel;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    if (this.dragging) {
      this.widget.posX += dx;
      this.widget.posY += dy;
    } else if (this.resizing) {
      this.widget.width = Math.max(MIN_W, (this.widget.width || 380) + dx);
      this.widget.height = Math.max(MIN_H, (this.widget.height || 300) + dy);
    }
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  onMouseUp(): void {
    this.dragging = false;
    this.resizing = false;
  }

  onLink(event: MouseEvent): void {
    event.stopPropagation();
    this.link.emit(this.widget.id);
  }

  toggleMinimize(event: MouseEvent): void {
    event.stopPropagation();
    this.widget.minimize = !this.widget.minimize;
  }

  onDuplicate(event: MouseEvent): void {
    event.stopPropagation();
    this.duplicate.emit({
      id: this.widget.id,
      currentX: this.widget.posX,
      currentY: this.widget.posY,
    });
  }

  onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(this.widget.id);
  }
}
