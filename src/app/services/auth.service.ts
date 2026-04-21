import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, User, UserResponse } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(`${this.baseUrl}/login`, { email, password }).pipe(
      map(res => res.data),
      tap(data => {
        this.setSession(data);
      }),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      // Fire and forget logout api call
      this.http.post(`${this.baseUrl}/logout`, {}, { headers }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<{ success: boolean; data: { accessToken: string } }> {
    const rToken = this.getRefreshToken();
    if (!rToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<{ success: boolean; data: { accessToken: string } }>(`${this.baseUrl}/refresh-token`, { refreshToken: rToken }).pipe(
      tap(res => {
        if (res.success && res.data.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
        }
      }),
      catchError(err => {
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          // Update stored user if needed
          localStorage.setItem('user', JSON.stringify(res.data));
          this.currentUserSubject.next(res.data);
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  setSession(authResult: AuthResponse): void {
    localStorage.setItem('accessToken', authResult.accessToken);
    localStorage.setItem('refreshToken', authResult.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // JWT exp is in seconds, Date.now() is ms
      return Math.floor(Date.now() / 1000) >= payload.exp;
    } catch {
      return true;
    }
  }
}
