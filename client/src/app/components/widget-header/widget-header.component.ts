import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gitNetworkOutline, copyOutline, removeOutline, addOutline, closeOutline,
  pulseOutline, pricetagOutline, walletOutline, documentTextOutline,
  swapVerticalOutline, calculatorOutline, timeOutline,
} from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { WidgetData, widgetIcon, widgetNameKey, DuplicatePayload } from '$core/models/widget.model';

@Component({
  selector: 'app-widget-header',
  standalone: true,
  imports: [IonButton, IonIcon, TranslocoModule],
  template: `
    <header class="widget-header">
      <div class="header-info">
        <ion-icon class="widget-type-icon" [name]="icon"></ion-icon>
        <span class="ticker-name">{{ widget.ticker || widget.title || (nameKey | transloco) }}</span>
      </div>
      <div class="widget-controls">
        @if (showLink) {
          <ion-button fill="clear" size="small" class="control-btn" title="Collega" (click)="onLink($event)">
            <ion-icon slot="icon-only" name="git-network-outline"></ion-icon>
          </ion-button>
        }
        <ion-button fill="clear" size="small" class="control-btn" title="Duplica" (click)="onDuplicate($event)">
          <ion-icon slot="icon-only" name="copy-outline"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" class="control-btn" title="Minimizza" (click)="onMinimize($event)">
          <ion-icon slot="icon-only" [name]="widget.minimize ? 'add-outline' : 'remove-outline'"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" class="control-btn close" title="Chiudi" (click)="onClose($event)">
          <ion-icon slot="icon-only" name="close-outline"></ion-icon>
        </ion-button>
      </div>
    </header>
  `,
})
export class WidgetHeaderComponent {
  @Input({ required: true }) widget!: WidgetData;
  @Input() showLink = false;

  @Output() link = new EventEmitter<string>();
  @Output() duplicate = new EventEmitter<DuplicatePayload>();
  @Output() remove = new EventEmitter<string>();

  constructor() {
    addIcons({
      gitNetworkOutline, copyOutline, removeOutline, addOutline, closeOutline,
      pulseOutline, pricetagOutline, walletOutline, documentTextOutline,
      swapVerticalOutline, calculatorOutline, timeOutline,
    });
  }

  get icon(): string {
    return widgetIcon(this.widget.type);
  }

  get nameKey(): string {
    return widgetNameKey(this.widget.type);
  }

  onLink(event: MouseEvent): void {
    event.stopPropagation();
    this.link.emit(this.widget.id);
  }

  onDuplicate(event: MouseEvent): void {
    event.stopPropagation();
    this.duplicate.emit({ id: this.widget.id, currentX: this.widget.posX, currentY: this.widget.posY });
  }

  onMinimize(event: MouseEvent): void {
    event.stopPropagation();
    this.widget.minimize = !this.widget.minimize;
  }

  onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(this.widget.id);
  }
}
