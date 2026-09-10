import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WidgetData, widgetBackground, DuplicatePayload } from '$core/models/widget.model';
import { ResizeHandleDirective } from '$core/directives/resize-handle.directive';
import { DragHandleDirective } from '$core/directives/drag-handle.directive';
import { WidgetHeaderComponent } from '$components/widget-header/widget-header.component';

@Component({
  selector: 'app-connection-hub',
  standalone: true,
  imports: [ResizeHandleDirective, DragHandleDirective, WidgetHeaderComponent],
  templateUrl: './connection-hub.component.html',
  styleUrls: ['./connection-hub.component.scss'],
})
export class ConnectionHubComponent {
  @Input({ required: true }) widget!: WidgetData;
  @Input() allWidgets: WidgetData[] = [];
  @Input() zoomLevel = 1;

  @Output() link = new EventEmitter<string>();
  @Output() duplicate = new EventEmitter<DuplicatePayload>();
  @Output() remove = new EventEmitter<string>();

  bg(): string | null {
    return widgetBackground(this.widget);
  }

  get connectedWidgets(): WidgetData[] {
    if (!this.widget.connectedIDs) {
      return [];
    }
    return this.allWidgets.filter((w) => this.widget.connectedIDs?.includes(w.id));
  }
}
