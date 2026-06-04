import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  try {
    const decoded: any = jwtDecode(token);
    const rolesPermitidos = route.data['roles'] as string[] | undefined;

    if (!rolesPermitidos || rolesPermitidos.includes(decoded.rol)) {
      return true;
    }

    return router.createUrlTree(['/acceso-denegado']);
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return router.createUrlTree(['/login']);
  }
};
