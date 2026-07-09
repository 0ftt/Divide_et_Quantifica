const TOKEN_KEY = 'deq_token';
const OFFLINE_KEY = 'deq_offline_session';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasOfflineSession(): boolean {
  return localStorage.getItem(OFFLINE_KEY) === '1';
}

export function setOfflineSession(active: boolean): void {
  if (active) {
    localStorage.setItem(OFFLINE_KEY, '1');
  } else {
    localStorage.removeItem(OFFLINE_KEY);
  }
}
