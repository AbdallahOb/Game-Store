import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { AuthTokens } from './models';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USERNAME_KEY = 'username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals so components (e.g. the sidebar) can reactively show logged-in state.
  isAuthenticated = signal(!!this.getAccessToken());
  username = signal(localStorage.getItem(USERNAME_KEY));

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${API_BASE_URL}/auth/login/`, { username, password }).pipe(
      tap((tokens) => this.storeSession(username, tokens))
    );
  }

  refreshAccessToken(): Observable<{ access: string }> {
    return this.http
      .post<{ access: string }>(`${API_BASE_URL}/auth/refresh/`, { refresh: this.getRefreshToken() })
      .pipe(tap(({ access }) => localStorage.setItem(ACCESS_KEY, access)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERNAME_KEY);
    this.isAuthenticated.set(false);
    this.username.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private storeSession(username: string, tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
    localStorage.setItem(USERNAME_KEY, username);
    this.isAuthenticated.set(true);
    this.username.set(username);
  }
}
