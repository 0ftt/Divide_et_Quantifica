import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '$shared';
import { environment } from '../../../environments/environment';
import { getToken, setToken, clearToken } from './token.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(null);

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  hasToken(): boolean {
    return getToken() !== null;
  }

  restoreSession(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }
    if (!this.hasToken()) {
      return of(false);
    }
    return this.loadMe().pipe(
      map(() => true),
      catchError(() => {
        clearToken();
        return of(false);
      }),
    );
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, body)
      .pipe(tap((res) => this.applySession(res)));
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, body)
      .pipe(tap((res) => this.applySession(res)));
  }

  recover(email: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/recover`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/reset`, { token, password });
  }

  loadMe(): Observable<User> {
    return this.http
      .get<User>(`${environment.apiUrl}/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  patchCurrentUser(patch: Partial<User>): void {
    const user = this.currentUser();
    if (user) {
      this.currentUser.set({ ...user, ...patch });
    }
  }

  updateMe(patch: {
    displayName?: string;
    username?: string;
    phone?: string | null;
    avatarDataUrl?: string | null;
    address?: string;
    city?: string;
    postalCode?: string;
  }): Observable<User> {
    return this.http
      .patch<User>(`${environment.apiUrl}/me`, patch)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/me`);
  }

  logout(): void {
    clearToken();
    this.currentUser.set(null);
  }

  private applySession(res: AuthResponse): void {
    setToken(res.token);
    this.currentUser.set(res.user);
  }
}
