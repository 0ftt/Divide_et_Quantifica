import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asset, Quote, SymbolHit } from '$shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/assets`;

  list(): Observable<Asset[]> {
    return this.http.get<Asset[]>(this.base);
  }

  search(q: string): Observable<SymbolHit[]> {
    return this.http.get<SymbolHit[]>(`${this.base}/search`, { params: { q } });
  }

  add(ticker: string): Observable<Asset> {
    return this.http.post<Asset>(this.base, { ticker });
  }

  seed(): Observable<{ added: number; failed: string[] }> {
    return this.http.post<{ added: number; failed: string[] }>(`${this.base}/seed`, {});
  }

  remove(ticker: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${ticker}`);
  }

  quote(ticker: string, force = false): Observable<Quote> {
    const params: Record<string, string> = force ? { force: '1' } : {};
    return this.http.get<Quote>(`${this.base}/${ticker}/quote`, { params });
  }
}
