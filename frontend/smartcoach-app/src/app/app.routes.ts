import { Routes } from '@angular/router';
import { Login } from '../auth/login/login';
import { Register } from '../auth/register/register';
import { CrearJugador } from '../admin/crear-jugador/crear-jugador';
import { AuthGuard } from '../guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login},
  { path: 'register', component: Register},
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'dashboard-admin', component: CrearJugador, canActivate: [AuthGuard]},
];