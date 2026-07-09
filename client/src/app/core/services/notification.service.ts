import { Injectable, computed, signal } from '@angular/core';

export type NotificationType = 'success' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'deq_notifications';
const MAX_NOTIFICATIONS = 50;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<AppNotification[]>(this.loadFromStorage());

  readonly notifications = computed(() => this.items());

  readonly unreadCount = computed(() => this.items().filter((n) => !n.read).length);

  notify(message: string, type: NotificationType = 'info'): void {
    this.push(message, type);
  }

  private push(message: string, type: NotificationType = 'info'): void {
    const entry: AppNotification = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const next = [entry, ...this.items()].slice(0, MAX_NOTIFICATIONS);
    this.items.set(next);
    this.saveToStorage(next);
  }

  syncReviews(reviews: { id: string; authorName: string; body: string }[]): void {
    const known = new Set(this.items().map((n) => n.id));

    for (const r of [...reviews].reverse()) {
      const id = `review-${r.id}`;
      if (known.has(id)) {
        continue;
      }
      const entry: AppNotification = {
        id,
        message: `${r.authorName}: "${r.body}"`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
      };
      this.items.set([entry, ...this.items()].slice(0, MAX_NOTIFICATIONS));
    }
    this.saveToStorage(this.items());
  }

  markAllRead(): void {
    const next = this.items().map((n) => ({ ...n, read: true }));
    this.items.set(next);
    this.saveToStorage(next);
  }

  private loadFromStorage(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppNotification[]) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: AppNotification[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}
