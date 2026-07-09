import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  closeOutline,
  copyOutline,
  gitNetworkOutline,
  removeOutline,
} from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetBackground, widgetNameKey } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';

export interface HubDuplicatePayload {
  id: string;
  currentX: number;
  currentY: number;
}

@Component({
  selector: 'app-connection-hub',
  standalone: true,
  imports: [IonButton, IonIcon, TranslocoModule, ResizeHandleDirective],
  templateUrl: './connection-hub.component.html',
  styleUrls: ['./connection-hub.component.scss'],
})
export class ConnectionHubComponent {

  @Input({ required: true }) widget!: WidgetData;

  bg(): string | null {
    return widgetBackground(this.widget);
  }

  get nameKey(): string {
    return widgetNameKey(this.widget.type);
  }

  @Input() allWidgets: WidgetData[] = [];

  @Input() zoomLevel = 1;

  @Output() link = new EventEmitter<string>();

  @Output() duplicate = new EventEmitter<HubDuplicatePayload>();

  @Output() remove = new EventEmitter<string>();

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor() {
    addIcons({ gitNetworkOutline, copyOutline, removeOutline, addOutline, closeOutline });
  }

  get connectedWidgets(): WidgetData[] {
    if (!this.widget.connectedIDs) {
      return [];
    }
    return this.allWidgets.filter((w) => this.widget.connectedIDs?.includes(w.id));
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
