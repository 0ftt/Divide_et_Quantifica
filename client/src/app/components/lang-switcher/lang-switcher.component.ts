import { Component, inject } from '@angular/core';
import { LanguageService } from '$core/i18n/language.service';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  template: `
    <div class="lang-switcher">
      <button type="button" [class.active]="lang.current === 'it'"
              (click)="lang.set('it')">IT</button>
      <span class="sep">/</span>
      <button type="button" [class.active]="lang.current === 'en'"
              (click)="lang.set('en')">EN</button>
    </div>
  `,
  styles: [
    `
      .lang-switcher {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
      }
      button {
        background: none;
        border: none;
        color: var(--deq-text-muted);
        cursor: pointer;
        padding: 2px 4px;
        font-weight: 600;
      }
      button.active {
        color: var(--deq-accent-neon);
      }
      .sep {
        color: var(--deq-text-muted);
      }
    `,
  ],
})
export class LangSwitcherComponent {

  lang = inject(LanguageService);
}
