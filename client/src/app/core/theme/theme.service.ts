import { Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

const THEME_KEY = 'deq_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  readonly theme = signal<AppTheme>('dark');

  init(): void {
    const saved = localStorage.getItem(THEME_KEY) as AppTheme | null;
    this.apply(saved ?? 'dark');
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: AppTheme): void {
    this.apply(theme);
  }

  private apply(theme: AppTheme): void {
    this.theme.set(theme);
    localStorage.setItem(THEME_KEY, theme);
    document.body.classList.toggle('deq-light', theme === 'light');
  }
}
