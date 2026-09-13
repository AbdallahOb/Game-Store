import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const PUBLIC_PATHS = ['/auth/login/', '/auth/refresh/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));
  const accessToken = authService.getAccessToken();

  const authedReq =
    !isPublic && accessToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Try one silent refresh-and-retry on an expired/invalid access token.
      if (error.status === 401 && !isPublic && authService.getRefreshToken()) {
        return authService.refreshAccessToken().pipe(
          switchMap(({ access }) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${access}` } }))
          ),
          catchError((refreshError) => {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 401 && !isPublic) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
