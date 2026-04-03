import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { EditarEquipo } from './admin/equipo/editar-equipo/editar-equipo';
import { CrearEquipo } from './admin/equipo/crear-equipo/crear-equipo';
import { VerEquipos } from './admin/equipo/ver-equipos/ver-equipos';
import { CrearJugador } from './admin/jugador/crear-jugador/crear-jugador';
import { DashboardAdmin } from './admin/dashboard-admin/dashboard-admin';
import { DashboardDirectivo } from './directivo/dashboard-directivo/dashboard-directivo';
import { authGuard } from './guards/auth-guard';
import { DashboardUsuario } from './usuario/dashboard-usuario/dashboard-usuario';
import { VerUsuarios } from './admin/usuarios/ver-usuarios/ver-usuarios';
import { VerJugadores } from './admin/jugador/ver-jugadores/ver-jugadores';
import { EditarJugador } from './admin/jugador/editar-jugador/editar-jugador';
import { VerPartidos } from './admin/partidos/ver-partidos/ver-partidos';
import { VerEntrenamientos } from './admin/entrenamientos/ver-entrenamientos/ver-entrenamientos';
import { CrearPartidos } from './admin/partidos/crear-partidos/crear-partidos';

export const routes: Routes = [
  // AUTENTICACION
  { path: 'login', component: Login},
  { path: 'register', component: Register},
  { path: '', redirectTo: 'login', pathMatch: 'full'},

  // EQUIPOS
  { path: 'ver-equipos', component: VerEquipos },
  { path: 'crear-equipo', component: CrearEquipo },
  { path: 'editar-equipo/:id', component: EditarEquipo },

  // JUGADORES
  { path: 'crear-jugador', component: CrearJugador },
  { path: 'ver-jugadores', component: VerJugadores},
  { path: 'editar-jugador/:id', component: EditarJugador},

  // USUARIOS
  { path: 'ver-usuarios', component: VerUsuarios },


  //PARTIDOS
  { path: 'ver-partidos', component: VerPartidos },
  { path: 'crear-partidos', component: CrearPartidos },

  // ENTRENAMIENTOS
  { path: 'ver-entrenamientos', component: VerEntrenamientos },
  { path: 'crear-entrenamiento', component: CrearPartidos },

  //DASHBOARDS
  { path: 'dashboard-admin', component: DashboardAdmin, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'dashboard-directivo', component: DashboardDirectivo, canActivate: [authGuard], data: { roles: ['directivo'] } },
  { path: 'dashboard-entrenador', component: DashboardDirectivo, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  { path: 'dashboard-usuario', component: DashboardUsuario, canActivate: [authGuard], data: { roles: ['usuario'] } },
];
