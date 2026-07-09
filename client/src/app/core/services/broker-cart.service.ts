import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  ticker: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class BrokerCartService {
  private readonly lines = signal<CartLine[]>([]);

  readonly items = computed(() => this.lines());

  readonly totalQuantity = computed(() => this.lines().reduce((sum, l) => sum + l.quantity, 0));

  add(ticker: string, quantity = 1): void {
    const t = ticker.toUpperCase();
    const current = this.lines();
    const existing = current.find((l) => l.ticker === t);
    if (existing) {
      this.lines.set(current.map((l) => (l.ticker === t ? { ...l, quantity: l.quantity + quantity } : l)));
    } else {
      this.lines.set([...current, { ticker: t, quantity }]);
    }
  }

  addMany(items: CartLine[]): void {
    items.forEach((i) => this.add(i.ticker, i.quantity));
  }

  remove(ticker: string): void {
    this.lines.set(this.lines().filter((l) => l.ticker !== ticker));
  }

  clear(): void {
    this.lines.set([]);
  }
}
