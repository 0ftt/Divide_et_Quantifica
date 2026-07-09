import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderRequest, OrderResult, PortfolioResponse } from '$shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/portfolio`;

  get(): Observable<PortfolioResponse> {
    return this.http.get<PortfolioResponse>(this.base);
  }

  buy(order: OrderRequest): Observable<OrderResult> {
    return this.http.post<OrderResult>(`${this.base}/buy`, order);
  }

  sell(order: OrderRequest): Observable<OrderResult> {
    return this.http.post<OrderResult>(`${this.base}/sell`, order);
  }
}
