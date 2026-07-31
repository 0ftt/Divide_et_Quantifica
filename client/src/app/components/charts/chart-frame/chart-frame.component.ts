import {
  Component,
  EventEmitter,
  HostBinding,
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
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';
import { DragHandleDirective } from '$core/directives/drag-handle.directive';

@Component({
  selector: 'app-chart-frame',
  standalone: true,
  imports: [IonButton, IonIcon, TranslocoModule, ResizeHandleDirective, DragHandleDirective],
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
