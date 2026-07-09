import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type AppLang = 'it' | 'en';

const LANG_KEY = 'deq_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private transloco = inject(TranslocoService);

  init(): void {
    const saved = localStorage.getItem(LANG_KEY) as AppLang | null;
    if (saved) {
      this.transloco.setActiveLang(saved);
    }
  }

  get current(): string {
    return this.transloco.getActiveLang();
  }

  set(lang: AppLang): void {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(LANG_KEY, lang);
  }

  toggle(): void {
    this.set(this.current === 'it' ? 'en' : 'it');
  }
}
