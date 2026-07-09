import { Component, Input } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular/standalone';

export type SkeletonVariant = 'lines' | 'list' | 'card' | 'chart';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  template: `
    @switch (variant) {
      @case ('chart') {
        <div class="sk-chart">
          <ion-skeleton-text [animated]="true"></ion-skeleton-text>
        </div>
      }
      @case ('card') {
        <div class="sk-card">
          <ion-skeleton-text [animated]="true" class="sk-title"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk-line"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk-line short"></ion-skeleton-text>
        </div>
      }
      @case ('list') {
        @for (row of rows; track row) {
          <div class="sk-row">
            <ion-skeleton-text [animated]="true" class="sk-dot"></ion-skeleton-text>
            <div class="sk-row-text">
              <ion-skeleton-text [animated]="true" class="sk-line"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" class="sk-line short"></ion-skeleton-text>
            </div>
          </div>
        }
      }
      @default {
        @for (row of rows; track row) {
          <ion-skeleton-text [animated]="true" class="sk-line"></ion-skeleton-text>
        }
      }
    }
  `,
  styleUrls: ['./skeleton.component.scss'],
})
export class SkeletonComponent {

  @Input() variant: SkeletonVariant = 'lines';

  @Input() count = 3;

  get rows(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
