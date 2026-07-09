import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

function toRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
})
export class ColorPickerComponent {

  @Input() color?: string;

  @Input() opacity?: number;

  @Output() colorChange = new EventEmitter<string | undefined>();

  @Output() opacityChange = new EventEmitter<number | undefined>();

  open = false;

  private host = inject(ElementRef);

  get hex(): string {
    return this.color || '#0f172a';
  }

  get alpha(): number {
    return this.opacity ?? 45;
  }

  get preview(): string {
    return toRgba(this.hex, this.alpha);
  }

  get alphaGradient(): string {
    return `linear-gradient(90deg, ${toRgba(this.hex, 0)}, ${toRgba(this.hex, 100)})`;
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open = !this.open;
  }

  setColor(value: string): void {
    this.color = value;
    this.colorChange.emit(value);
  }

  setAlpha(value: number): void {
    this.opacity = +value;
    this.opacityChange.emit(+value);
  }

  reset(): void {
    this.color = undefined;
    this.opacity = undefined;
    this.colorChange.emit(undefined);
    this.opacityChange.emit(undefined);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
