import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent {

  @Input() open = false;

  @Input() title = '';

  @Input() dismissible = true;

  @Output() closed = new EventEmitter<void>();

  constructor() {
    addIcons({ closeOutline });
  }

  requestClose(): void {
    if (this.dismissible) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.open) {
      this.requestClose();
    }
  }
}
