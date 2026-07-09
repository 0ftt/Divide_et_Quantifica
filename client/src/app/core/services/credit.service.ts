import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BalanceResponse, RechargeResult, PremiumResult } from '$shared';
import { environment } from '../../../environments/environment';

export interface AppRevenue {
  total: number;
  premium: number;
  fees: number;
}

@Injectable({ providedIn: 'root' })
export class CreditService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getBalance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${this.base}/credit`);
  }

  recharge(amount: number): Observable<RechargeResult> {
    return this.http.post<RechargeResult>(`${this.base}/credit/recharge`, { amount });
  }

  purchasePremium(): Observable<PremiumResult> {
    return this.http.post<PremiumResult>(`${this.base}/premium/purchase`, {});
  }

  recordTradeFee(value: number): Observable<{ fee: number }> {
    return this.http.post<{ fee: number }>(`${this.base}/credit/trade-fee`, { value });
  }

  getAppRevenue(): Observable<AppRevenue> {
    return this.http.get<AppRevenue>(`${this.base}/admin/revenue`);
  }
}
