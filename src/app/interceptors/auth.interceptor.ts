import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(public authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // ── Skip auth logic entirely for public auth endpoints ──────────────────
    const isAuthEndpoint =
      request.url.includes('/auth/login') ||
      request.url.includes('/auth/refresh-token') ||
      request.url.includes('/auth/logout');

    if (isAuthEndpoint) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    // ── PROACTIVE refresh: token is expired → refresh BEFORE the request ────
    // This eliminates the 401 round-trip that was causing the loading spinner
    // to stay visible while reactive refresh completed.
    if (token && this.authService.isTokenExpired()) {
      return this.refreshAndRetry(request, next);
    }

    // ── Token valid → attach and proceed ────────────────────────────────────
    const authedRequest = token ? this.addToken(request, token) : request;

    return next.handle(authedRequest).pipe(
      catchError(error => {
        // Reactive fallback for unexpected 401s (e.g. server-side invalidation)
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.refreshAndRetry(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  /** Shared logic: refresh the access token, then replay the original request */
  private refreshAndRetry(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((res: any) => {
          this.isRefreshing = false;
          const newToken = res.data?.accessToken;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          // Session clear + navigate to /login is handled inside authService.refreshToken()
          return throwError(() => err);
        })
      );
    }

    // Another request is already refreshing — wait for the new token
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(jwt => next.handle(this.addToken(request, jwt)))
    );
  }
}
