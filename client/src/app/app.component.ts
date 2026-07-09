import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LanguageService } from './core/i18n/language.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    inject(LanguageService).init();
    inject(ThemeService).init();

    window.addEventListener('storage', (e) => {
      if (e.key === 'deq_token' || e.key === 'deq_offline_session') {
        window.location.reload();
      }
    });
  }
}
