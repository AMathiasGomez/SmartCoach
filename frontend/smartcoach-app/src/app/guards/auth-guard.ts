import { CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route) => {

  const token = localStorage.getItem('token');

  if (!token) return false;

  const decoded: any = jwtDecode(token);

  const rolesPermitidos = route.data['roles'];

  if (rolesPermitidos.includes(decoded.rol)) {
    return true;
  }

  return false;
};