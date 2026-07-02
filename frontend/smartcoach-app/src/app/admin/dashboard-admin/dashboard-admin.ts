import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { JugadorService } from '../../services/jugador/jugador-service';
import { EquipoService } from '../../services/equipo/equipo-service';
import { EntrenamientoService } from '../../services/entrenamiento/entrenamiento-service';
import { PartidoService } from '../../services/partido/partido-service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/users/user-service';
import { catchError, forkJoin, of } from 'rxjs';

interface DashboardActivity {
  event: string;
  object: string;
  status: string;
  time: string;
  tone: 'success' | 'info' | 'warning' | 'neutral';
}

interface PositionMetric {
  name: string;
  count: number;
  percent: number;
}

interface UpcomingItem {
  type: string;
  title: string;
  date: string;
  meta: string;
  route: string;
}

interface AdminAction {
  label: string;
  detail: string;
  route: string;
  icon: string;
  tone: string;
}

interface SystemAlert {
  title: string;
  detail: string;
  icon: string;
  tone: 'success' | 'warning' | 'info';
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {

  totalJugadores = 0;
  totalEquipos = 0;
  totalEntrenamientos = 0;
  totalPartidos = 0;
  totalUsuarios = 0;
  partidosPendientes = 0;
  entrenamientosProgramados = 0;
  coberturaEquipos = 0;
  promedioJugadores = 0;

  loading = true;
  error = '';
  adminName = 'Administrador';
  sidebarOpen = false;

  recentActivity: DashboardActivity[] = [];
  positionMetrics: PositionMetric[] = [];
  upcomingItems: UpcomingItem[] = [];
  systemAlerts: SystemAlert[] = [];
  adminActions: AdminAction[] = [
    {
      label: 'Nuevo jugador',
      detail: 'Registrar ficha deportiva',
      route: '/crear-jugador',
      icon: 'person_add',
      tone: 'blue',
    },
    {
      label: 'Nuevo equipo',
      detail: 'Crear plantilla y categoria',
      route: '/crear-equipo',
      icon: 'group_add',
      tone: 'green',
    },
    {
      label: 'Programar partido',
      detail: 'Agregar rival y fecha',
      route: '/crear-partido',
      icon: 'add_circle',
      tone: 'amber',
    },
    {
      label: 'Plan de entrenamiento',
      detail: 'Coordinar carga semanal',
      route: '/crear-entrenamiento',
      icon: 'fitness_center',
      tone: 'rose',
    },
  ];
  healthCards = [
    { label: 'Jugadores registrados', value: '0', icon: 'person', tone: 'players' },
    { label: 'Equipos activos', value: '0', icon: 'group', tone: 'teams' },
    { label: 'Partidos pendientes', value: '0', icon: 'sports_soccer', tone: 'matches' },
  ];

  constructor(
    private authService: AuthService,
    public router: Router,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private entrenamientoService: EntrenamientoService,
    private partidoService: PartidoService,
    private userService: UserService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const user = this.authService.getUser();
    this.adminName = user?.nombre || user?.name || 'Administrador';
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = '';
    this.cd.detectChanges();

    forkJoin({
      jugadores: this.jugadorService.getJugadores().pipe(catchError((err) => this.withFallback('jugadores', err, []))),
      equipos: this.equipoService.getEquipos().pipe(catchError((err) => this.withFallback('equipos', err, []))),
      entrenamientos: this.entrenamientoService.getEntrenamientos().pipe(catchError((err) => this.withFallback('entrenamientos', err, []))),
      partidos: this.partidoService.getPartidos().pipe(catchError((err) => this.withFallback('partidos', err, []))),
      usuarios: this.userService.getUsuarios().pipe(catchError((err) => this.withFallback('usuarios', err, []))),
    }).subscribe({
      next: ({ jugadores, equipos, entrenamientos, partidos, usuarios }) => {
        this.totalJugadores = jugadores.length;
        this.totalEquipos = equipos.length;
        this.totalEntrenamientos = entrenamientos.length;
        this.totalPartidos = partidos.length;
        this.totalUsuarios = usuarios.length;

        this.partidosPendientes = partidos.filter((partido: any) => partido.estado !== 'finalizado').length;
        this.entrenamientosProgramados = entrenamientos.filter((entrenamiento: any) => entrenamiento.estado === 'programado').length;
        this.promedioJugadores = this.totalEquipos ? Math.round(this.totalJugadores / this.totalEquipos) : 0;
        this.coberturaEquipos = this.totalEquipos
          ? Math.round((new Set(jugadores.map((jugador: any) => jugador.equipo_id).filter(Boolean)).size / this.totalEquipos) * 100)
          : 0;

        this.positionMetrics = this.buildPositionMetrics(jugadores);
        this.recentActivity = this.buildRecentActivity(jugadores, equipos, entrenamientos, partidos);
        this.upcomingItems = this.buildUpcomingItems(entrenamientos, partidos);
        this.systemAlerts = this.buildSystemAlerts();
        this.healthCards = [
          { label: 'Usuarios del sistema', value: String(this.totalUsuarios), icon: 'manage_accounts', tone: 'players' },
          { label: 'Jugadores por equipo', value: String(this.promedioJugadores), icon: 'groups', tone: 'teams' },
          { label: 'Cobertura de equipos', value: `${this.coberturaEquipos}%`, icon: 'verified', tone: 'matches' },
        ];

        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error = 'No se pudo cargar el panel de administracion.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  private withFallback(label: string, err: any, fallback: any[]) {
    console.error(`Error loading ${label}:`, err);
    this.error = 'Algunos datos no se pudieron cargar. Se muestran los disponibles.';
    return of(fallback);
  }

  private buildPositionMetrics(jugadores: any[]): PositionMetric[] {
    const counts = jugadores.reduce((acc: Record<string, number>, jugador: any) => {
      const position = jugador.posicion || 'Sin posicion';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: jugadores.length ? Math.round((count / jugadores.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private buildRecentActivity(jugadores: any[], equipos: any[], entrenamientos: any[], partidos: any[]): DashboardActivity[] {
    const activities: DashboardActivity[] = [
      ...jugadores.slice(0, 2).map((jugador: any) => ({
        event: 'Jugador registrado',
        object: jugador.nombre,
        status: jugador.equipo_nombre || 'Equipo por asignar',
        time: this.formatDate(jugador.created_at || jugador.fecha_nacimiento),
        tone: 'success' as const,
      })),
      ...equipos.slice(0, 2).map((equipo: any) => ({
        event: 'Equipo disponible',
        object: equipo.nombre,
        status: equipo.categoria || 'Categoria general',
        time: this.formatDate(equipo.created_at),
        tone: 'info' as const,
      })),
      ...partidos.slice(0, 2).map((partido: any) => ({
        event: 'Partido en calendario',
        object: partido.nombre || `${partido.equipo_nombre || 'Equipo'} vs ${partido.rival || 'Rival'}`,
        status: partido.estado || 'programado',
        time: this.formatDate(partido.fecha),
        tone: partido.estado === 'finalizado' ? 'success' as const : 'warning' as const,
      })),
      ...entrenamientos.slice(0, 2).map((entrenamiento: any) => ({
        event: 'Entrenamiento planificado',
        object: entrenamiento.tipo || 'Sesion',
        status: entrenamiento.equipo_nombre || 'Equipo',
        time: this.formatDate(entrenamiento.fecha),
        tone: entrenamiento.estado === 'completado' ? 'success' as const : 'neutral' as const,
      })),
    ];

    return activities.slice(0, 6);
  }

  private buildSystemAlerts(): SystemAlert[] {
    const alerts: SystemAlert[] = [];

    if (this.totalEquipos === 0) {
      alerts.push({
        title: 'Sin equipos creados',
        detail: 'Crea el primer equipo para organizar jugadores, entrenamientos y partidos.',
        icon: 'groups',
        tone: 'warning',
      });
    }

    if (this.totalJugadores === 0) {
      alerts.push({
        title: 'Plantilla vacia',
        detail: 'Registra jugadores para activar metricas por posicion y cobertura.',
        icon: 'person_add',
        tone: 'warning',
      });
    }

    if (this.partidosPendientes > 0) {
      alerts.push({
        title: 'Partidos por cerrar',
        detail: `${this.partidosPendientes} partido(s) siguen pendientes de finalizacion.`,
        icon: 'sports_score',
        tone: 'info',
      });
    }

    if (this.entrenamientosProgramados === 0 && this.totalEntrenamientos > 0) {
      alerts.push({
        title: 'Agenda sin proximas sesiones',
        detail: 'No hay entrenamientos programados en este momento.',
        icon: 'event_busy',
        tone: 'info',
      });
    }

    if (!alerts.length) {
      alerts.push({
        title: 'Operacion estable',
        detail: 'El panel no detecta pendientes criticos con los datos actuales.',
        icon: 'verified',
        tone: 'success',
      });
    }

    return alerts.slice(0, 3);
  }

  private buildUpcomingItems(entrenamientos: any[], partidos: any[]): UpcomingItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [
      ...entrenamientos.map((entrenamiento: any) => ({
        type: 'Entrenamiento',
        title: entrenamiento.tipo || 'Sesion de entrenamiento',
        date: entrenamiento.fecha,
        meta: `${entrenamiento.equipo_nombre || 'Equipo'}${entrenamiento.hora ? ' - ' + entrenamiento.hora : ''}`,
        route: '/ver-entrenamientos',
      })),
      ...partidos.map((partido: any) => ({
        type: 'Partido',
        title: partido.nombre || `${partido.equipo_nombre || 'Equipo'} vs ${partido.rival || 'Rival'}`,
        date: partido.fecha,
        meta: partido.ubicacion || partido.tipo || 'Agenda deportiva',
        route: '/ver-partidos',
      })),
    ]
      .filter((item) => {
        const date = new Date(item.date);
        date.setHours(0, 0, 0, 0);
        return !Number.isNaN(date.getTime()) && date >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }

  formatDate(value: string): string {
    if (!value) return 'Sin fecha';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  getAgendaIcon(type: string): string {
    return type === 'Partido' ? 'sports_soccer' : 'fitness_center';
  }

}
