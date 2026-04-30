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
import { DetallePartido } from './entrenador/partidos/detalle-partido/detalle-partido';
import { CrearEntrenamiento } from './admin/entrenamientos/crear-entrenamiento/crear-entrenamiento';
import { EditarPartido } from './admin/partidos/editar-partido/editar-partido';
import { DashboardEntrenador } from './entrenador/dashboard-entrenador/dashboard-entrenador';
import { DetalleEntrenamiento } from './entrenador/entrenamientos/detalle-entrenamiento/detalle-entrenamiento';
import { VerEntrenamientosE } from './entrenador/entrenamientos/ver-entrenamientos-e/ver-entrenamientos-e';
import { VerPartidosE } from './entrenador/partidos/ver-partidos-e/ver-partidos-e';
import { VerJugadoresE } from './entrenador/jugadores/ver-jugadores-e/ver-jugadores-e';
import { DetalleJugador } from './entrenador/jugadores/detalle-jugador/detalle-jugador';
import { VerEquiposE } from './entrenador/equipos/ver-equipos-e/ver-equipos-e';
import { DetalleEquipo } from './entrenador/equipos/detalle-equipo/detalle-equipo';

export const routes: Routes = [
  // AUTENTICACION
  { path: 'login', component: Login},
  { path: 'register', component: Register},
  { path: '', redirectTo: 'login', pathMatch: 'full'},

  // EQUIPOS

  //ADMIN
  { path: 'ver-equipos', component: VerEquipos, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'crear-equipo', component: CrearEquipo, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'editar-equipo/:id', component: EditarEquipo, canActivate: [authGuard], data: { roles: ['administrador'] } },

  //ENTRENADOR
  { path: 'ver-equipos-e', component: VerEquiposE, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  { path: 'detalle-equipo/:id', component: DetalleEquipo, canActivate: [authGuard], data: { roles: ['entrenador'] } },


  // JUGADORES

  //ADMIN
  { path: 'crear-jugador', component: CrearJugador, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'ver-jugadores', component: VerJugadores, canActivate: [authGuard], data: { roles: ['administrador'] }},
  { path: 'editar-jugador/:id', component: EditarJugador, canActivate: [authGuard], data: { roles: ['administrador'] }},

  //ENTRENADOR
  { path: 'ver-jugadores-e', component: VerJugadoresE, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  { path: 'detalle-jugador/:id', component: DetalleJugador, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  
  
  //PARTIDOS
  
  //ADMIN
  { path: 'ver-partidos', component: VerPartidos, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'crear-partido', component: CrearPartidos, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'editar-partido/:id', component: EditarPartido, canActivate: [authGuard], data: { roles: ['administrador'] } },
  
  //ENTRENADOR
  { path: 'ver-partidos-e', component: VerPartidosE, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  { path: 'detalle-partido/:id', component: DetallePartido, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  
  
  // ENTRENAMIENTOS

  //ADMIN
  { path: 'ver-entrenamientos', component: VerEntrenamientos, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'crear-entrenamiento', component: CrearEntrenamiento, canActivate: [authGuard], data: { roles: ['administrador'] } },
  
  //ENTRENADOR
  { path: 'ver-entrenamientos-e', component: VerEntrenamientosE, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  { path: 'detalle-entrenamiento/:id', component: DetalleEntrenamiento, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  
  
  //DASHBOARDS
  { path: 'dashboard-admin', component: DashboardAdmin, canActivate: [authGuard], data: { roles: ['administrador'] } },
  { path: 'dashboard-directivo', component: DashboardDirectivo, canActivate: [authGuard], data: { roles: ['directivo'] } },
  { path: 'dashboard-entrenador', component: DashboardEntrenador, canActivate: [authGuard], data: { roles: ['entrenador'] } },
  { path: 'dashboard-usuario', component: DashboardUsuario, canActivate: [authGuard], data: { roles: ['usuario'] } },


  // USUARIOS
  { path: 'ver-usuarios', component: VerUsuarios, canActivate: [authGuard], data: { roles: ['administrador'] } },
];
