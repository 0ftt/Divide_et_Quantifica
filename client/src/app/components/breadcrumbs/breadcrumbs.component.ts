import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, IonIcon],
  template: `
    <nav class="breadcrumbs">
      <a class="crumb" routerLink="/dashboard">
        <ion-icon name="home-outline"></ion-icon>
        <span>Dashboard</span>
      </a>
      <ion-icon class="sep" name="chevron-forward-outline"></ion-icon>
      <span class="crumb current">{{ current }}</span>
    </nav>
  `,
  styles: [
    `
      .breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
      }
      .crumb {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--deq-text-muted);
        text-decoration: none;
      }
      a.crumb {
        cursor: pointer;
        transition: color 0.15s ease;
      }
      a.crumb:hover {
        color: var(--deq-accent-neon);
      }
      .crumb.current {
        color: var(--deq-text-bright);
        font-weight: 600;
      }
      .sep {
        color: var(--deq-text-muted);
        font-size: 0.8rem;
      }
      ion-icon {
        font-size: 1rem;
      }
    `,
  ],
})
export class BreadcrumbsComponent {
  @Input({ required: true }) current = '';

  constructor() {
    addIcons({ homeOutline, chevronForwardOutline });
  }
}
