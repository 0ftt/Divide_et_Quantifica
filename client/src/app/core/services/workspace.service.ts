import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/workspace`;

  get(): Observable<{ state: unknown }> {
    return this.http.get<{ state: unknown }>(this.base);
  }

  save(state: unknown): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(this.base, { state });
  }
}
