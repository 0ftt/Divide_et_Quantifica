import { Directive, HostListener, Input } from '@angular/core';
import { WidgetData } from '$core/models/widget.model';

// Rende trascinabile sulla canvas l'elemento su cui è applicata (`appDrag`).
@Directive({
  selector: '[appDrag]',
  standalone: true,
})
export class DragHandleDirective {
  @Input('appDragTarget') target!: WidgetData;
  @Input('appDragZoom') zoom = 1;

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  @HostListener('pointerdown', ['$event'])
  onDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    event.preventDefault();
  }

  @HostListener('window:pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.target.posX += (event.clientX - this.lastX) / this.zoom;
    this.target.posY += (event.clientY - this.lastY) / this.zoom;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  onUp(): void {
    this.dragging = false;
  }
}
