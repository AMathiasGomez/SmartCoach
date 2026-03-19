import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { EditarEquipo } from './admin/equipo/editar-equipo/editar-equipo';
import { CrearEquipo } from './admin/equipo/crear-equipo/crear-equipo';
import { VerEquipos } from './admin/equipo/ver-equipos/ver-equipos';
import { CrearJugador } from './admin/jugador/crear-jugador/crear-jugador';
import { DashboardAdmin } from './admin/dashboard-admin/dashboard-admin';
import { DashboardDirectivo } from './directivo/dashboard-directivo/dashboard-directivo';

export const routes: Routes = [
  { path: 'login', component: Login},
  { path: 'register', component: Register},
  { path: '', redirectTo: 'login', pathMatch: 'full'},
  { path: 'ver-equipos', component: VerEquipos },
  { path: 'crear-equipo', component: CrearEquipo },
  { path: 'editar-equipo/:id', component: EditarEquipo },
  { path: 'crear-jugador', component: CrearJugador },
  { path: 'dashboard-admin', component: DashboardAdmin},
  { path: 'dashboard-directivo', component: DashboardDirectivo},
];
