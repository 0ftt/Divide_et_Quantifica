import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  credit: number;
  isPremium: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/admin/users`);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/admin/users/${id}`);
  }
}
