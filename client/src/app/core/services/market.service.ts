import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetHistory } from '$shared';
import { environment } from '../../../environments/environment';

export interface MarketStatus {
  intervalMinutes: number;
  lastUpdate: string | null;
  nextUpdate: string | null;
  running: boolean;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class MarketService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/assets`;

  status(): Observable<MarketStatus> {
    return this.http.get<MarketStatus>(`${environment.apiUrl}/market/status`);
  }

  refreshNow(): Observable<MarketStatus> {
    return this.http.post<MarketStatus>(`${environment.apiUrl}/admin/market/refresh`, {});
  }

    history(ticker: string, timeframe = '1d', force = false): Observable<AssetHistory> {
    const params: Record<string, string> = { timeframe };
    if (force) {
      params['force'] = '1';
    }
    return this.http.get<AssetHistory>(`${this.base}/${ticker}/history`, { params });
  }
}
