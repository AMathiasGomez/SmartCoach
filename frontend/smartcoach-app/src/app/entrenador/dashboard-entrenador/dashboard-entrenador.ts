import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JugadorService } from '../../services/jugador/jugador-service';
import { EquipoService } from '../../services/equipo/equipo-service';
import { EntrenamientoService } from '../../services/entrenamiento/entrenamiento-service';
import { PartidoService } from '../../services/partido/partido-service';
import { Equipo } from '../../models/equipo.model';
import { Jugador } from '../../models/jugador.model';
import { environment } from '../../../environments/environment';
import { catchError, forkJoin, Observable, of, timeout } from 'rxjs';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  tone: string;
}

interface PositionStat {
  posicion: string;
  total: number;
  percent: number;
}

@Component({
  selector: 'app-dashboard-entrenador',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard-entrenador.html',
  styleUrls: ['./dashboard-entrenador.css'],
})
export class DashboardEntrenador implements OnInit {
  totalJugadores = 0;
  totalEquipos = 0;
  totalEntrenamientos = 0;
  totalPartidos = 0;
  entrenamientosSemana = 0;
  partidosMes = 0;

  jugadores: Jugador[] = [];
  equipos: Equipo[] = [];
  partidosRecientes: any[] = [];
  entrenamientosProximos: any[] = [];
  positionDistribution: PositionStat[] = [];
  alertas: string[] = [];
  equipoDestacado: (Equipo & { jugadores_count?: number }) | null = null;

  loading = true;
  error = '';
  todayLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  quickActions: QuickAction[] = [
    { label: 'Ver equipos', icon: 'groups', route: '/ver-equipos-e', tone: 'blue' },
    { label: 'Ver jugadores', icon: 'person_search', route: '/ver-jugadores-e', tone: 'green' },
    { label: 'Entrenamientos', icon: 'fitness_center', route: '/ver-entrenamientos-e', tone: 'amber' },
    { label: 'Partidos', icon: 'sports_soccer', route: '/ver-partidos-e', tone: 'violet' },
    { label: 'Clasificacion', icon: 'leaderboard', route: '/clasificacion-jugadores', tone: 'rose' },
  ];

  private baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private authService: AuthService,
    public router: Router,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private entrenamientoService: EntrenamientoService,
    private partidoService: PartidoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = '';

    forkJoin({
      jugadores: this.withFallback(this.jugadorService.getJugadores(), [] as Jugador[]),
      equipos: this.withFallback(this.equipoService.getEquipos(), [] as Equipo[]),
      entrenamientos: this.withFallback(this.entrenamientoService.getEntrenamientos(), [] as any[]),
      partidos: this.withFallback(this.partidoService.getPartidos(), [] as any[])
    }).subscribe({
      next: ({ jugadores, equipos, entrenamientos, partidos }) => {
        this.jugadores = jugadores;
        this.equipos = equipos;
        this.totalJugadores = jugadores.length;
        this.totalEquipos = equipos.length;
        this.totalEntrenamientos = entrenamientos.length;
        this.totalPartidos = partidos.length;

        this.entrenamientosProximos = this.getUpcomingItems(entrenamientos, 4);
        this.entrenamientosSemana = this.countItemsInNextDays(entrenamientos, 7);
        this.partidosMes = this.countItemsInCurrentMonth(partidos);
        this.partidosRecientes = this.getRecentMatches(partidos);
        this.positionDistribution = this.getPositionDistribution(jugadores);
        this.equipoDestacado = this.getFeaturedTeam(equipos, jugadores);
        this.alertas = this.buildAlerts();

        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error = 'No se pudo cargar la informacion del dashboard.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  getFotoEquipo(fotoUrl?: string): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    return `${this.baseUrl}${fotoUrl}`;
  }

  getInitials(name?: string): string {
    return (name || 'E').slice(0, 1).toUpperCase();
  }

  getNextTrainingLabel(): string {
    return this.entrenamientosProximos[0]?.fecha_corta || 'Sin programar';
  }

  private getUpcomingItems(items: any[], limit: number): any[] {
    const today = this.startOfDay(new Date());

    return [...items]
      .filter(item => {
        const date = this.parseDate(item.fecha);
        return date && date >= today;
      })
      .sort((a, b) => this.parseDate(a.fecha)!.getTime() - this.parseDate(b.fecha)!.getTime())
      .slice(0, limit)
      .map(item => ({
        ...item,
        fecha_corta: this.formatShortDate(item.fecha),
        fecha_relativa: this.formatRelativeDate(item.fecha)
      }));
  }

  private getRecentMatches(partidos: any[]): any[] {
    return [...partidos]
      .filter(partido => this.parseDate(partido.fecha))
      .sort((a, b) => this.parseDate(b.fecha)!.getTime() - this.parseDate(a.fecha)!.getTime())
      .slice(0, 5)
      .map(partido => ({
        ...partido,
        fecha_corta: this.formatShortDate(partido.fecha),
        estado_label: partido.estado || partido.resultado || 'Registrado'
      }));
  }

  private getPositionDistribution(jugadores: Jugador[]): PositionStat[] {
    const counts = jugadores.reduce((acc, jugador) => {
      const posicion = jugador.posicion || 'Sin posicion';
      acc[posicion] = (acc[posicion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([posicion, total]) => ({
        posicion,
        total,
        percent: jugadores.length ? Math.round((total / jugadores.length) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  private getFeaturedTeam(equipos: Equipo[], jugadores: Jugador[]): (Equipo & { jugadores_count?: number }) | null {
    if (!equipos.length) return null;

    const teamCounts = jugadores.reduce((acc, jugador) => {
      const key = Number(jugador.equipo_id);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const featured = [...equipos].sort((a, b) => {
      const totalA = a.id ? teamCounts[a.id] || 0 : 0;
      const totalB = b.id ? teamCounts[b.id] || 0 : 0;
      return totalB - totalA;
    })[0];

    return {
      ...featured,
      jugadores_count: featured.id ? teamCounts[featured.id] || 0 : 0
    };
  }

  private buildAlerts(): string[] {
    const alerts: string[] = [];

    if (this.totalEquipos === 0) alerts.push('Aun no hay equipos registrados.');
    if (this.totalJugadores === 0) alerts.push('No hay jugadores cargados para seguimiento.');
    if (this.entrenamientosProximos.length === 0) alerts.push('No hay entrenamientos proximos en agenda.');
    if (this.partidosRecientes.length === 0) alerts.push('Todavia no hay partidos registrados.');
    if (this.positionDistribution.length > 0 && this.positionDistribution[0].percent >= 45) {
      alerts.push(`Alta concentracion de jugadores en ${this.positionDistribution[0].posicion}.`);
    }

    return alerts.slice(0, 4);
  }

  private countItemsInNextDays(items: any[], days: number): number {
    const today = this.startOfDay(new Date());
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);

    return items.filter(item => {
      const date = this.parseDate(item.fecha);
      return date && date >= today && date <= limit;
    }).length;
  }

  private countItemsInCurrentMonth(items: any[]): number {
    const today = new Date();
    return items.filter(item => {
      const date = this.parseDate(item.fecha);
      return date && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    }).length;
  }

  private parseDate(value: string | Date | undefined | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private formatShortDate(value: string | Date): string {
    const date = this.parseDate(value);
    if (!date) return 'Sin fecha';
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }

  private formatRelativeDate(value: string | Date): string {
    const date = this.parseDate(value);
    if (!date) return '';

    const today = this.startOfDay(new Date());
    const target = this.startOfDay(date);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Manana';
    if (diff < 7) return `En ${diff} dias`;
    return this.formatShortDate(date);
  }

  private withFallback<T>(request: Observable<T>, fallback: T): Observable<T> {
    return request.pipe(
      timeout(7000),
      catchError((err: any) => {
        console.error('Dashboard request fallback:', err);
        this.error = 'Algunos datos no respondieron a tiempo, pero el dashboard se cargo con la informacion disponible.';
        this.cd.detectChanges();
        return of(fallback);
      })
    );
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
