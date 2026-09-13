import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

// Only checks that a token exists, not that it's still valid - an expired token is
// handled later, by authInterceptor's refresh-and-retry (or its logout on failure).
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getAccessToken()) {
    return true;
  }

  return router.parseUrl('/login');
};
