import { Directive, HostListener, Input } from '@angular/core';
import { WidgetData } from '$core/models/widget.model';

@Directive({
  selector: '[appResize]',
  standalone: true,
})
export class ResizeHandleDirective {

  @Input('appResizeTarget') target!: WidgetData;

  @Input('appResizeZoom') zoom = 1;

  @Input('appResizeMinW') minW = 240;
  @Input('appResizeMinH') minH = 120;

  private resizing = false;
  private lastX = 0;
  private lastY = 0;

  @HostListener('pointerdown', ['$event'])
  onDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.resizing = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  @HostListener('window:pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!this.resizing) {
      return;
    }
    const dx = (event.clientX - this.lastX) / this.zoom;
    const dy = (event.clientY - this.lastY) / this.zoom;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.target.width = Math.max(this.minW, (this.target.width || 300) + dx);
    this.target.height = Math.max(this.minH, (this.target.height || 220) + dy);
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  onUp(): void {
    this.resizing = false;
  }
}
