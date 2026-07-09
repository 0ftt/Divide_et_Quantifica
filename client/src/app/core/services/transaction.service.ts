import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Transaction {
  id: string;
  type: 'recharge' | 'premium' | 'buy' | 'sell';
  ticker: string | null;
  quantity: number | null;
  amount: number;
  note: string;
  createdAt: string;
}

export interface AssetEvent {
  id: string;
  ticker: string;
  name: string;
  action: 'add' | 'remove';
  actor: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/transactions`);
  }

  assetEvents(): Observable<AssetEvent[]> {
    return this.http.get<AssetEvent[]>(`${this.base}/admin/asset-events`);
  }
}
