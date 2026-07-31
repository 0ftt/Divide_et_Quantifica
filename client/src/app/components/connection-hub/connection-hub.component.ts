import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { DragHandleDirective } from '$core/directives/drag-handle.directive';

export interface HubDuplicatePayload {
  id: string;
  currentX: number;
  currentY: number;
}

@Component({
  selector: 'app-connection-hub',
  standalone: true,
  imports: [IonButton, IonIcon, TranslocoModule, ResizeHandleDirective, DragHandleDirective],
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

  constructor() {
    addIcons({ gitNetworkOutline, copyOutline, removeOutline, addOutline, closeOutline });
  }

  get connectedWidgets(): WidgetData[] {
    if (!this.widget.connectedIDs) {
      return [];
    }
    return this.allWidgets.filter((w) => this.widget.connectedIDs?.includes(w.id));
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
