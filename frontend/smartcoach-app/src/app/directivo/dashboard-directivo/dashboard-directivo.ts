import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import { EntrenamientoService } from '../../services/entrenamiento/entrenamiento-service';
import { EquipoService } from '../../services/equipo/equipo-service';
import { JugadorService } from '../../services/jugador/jugador-service';
import { PartidoService } from '../../services/partido/partido-service';
import { DirectivoAgendaComponent } from './components/directivo-agenda/directivo-agenda';
import { DirectivoHeroComponent } from './components/directivo-hero/directivo-hero';
import { DirectivoKpisComponent } from './components/directivo-kpis/directivo-kpis';
import { DirectivoOverviewComponent } from './components/directivo-overview/directivo-overview';
import { DirectivoReportsComponent } from './components/directivo-reports/directivo-reports';
import { DirectivoSidebarComponent } from './components/directivo-sidebar/directivo-sidebar';
import { DirectivoTeamsComponent } from './components/directivo-teams/directivo-teams';

export type ReportStatus = 'Listo' | 'Requiere seguimiento' | 'En observacion';
export type DirectivoSection = 'resumen' | 'reportes' | 'equipos' | 'agenda';

export interface ExecutiveReport {
  title: string;
  category: string;
  owner: string;
  status: ReportStatus;
  summary: string;
  metric: string;
}

export interface Insight {
  icon: string;
  title: string;
  detail: string;
  tone: 'success' | 'warning' | 'info';
}

export interface ChartBar {
  label: string;
  value: number;
  detail: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-directivo',
  standalone: true,
  imports: [
    CommonModule,
    DirectivoAgendaComponent,
    DirectivoHeroComponent,
    DirectivoKpisComponent,
    DirectivoOverviewComponent,
    DirectivoReportsComponent,
    DirectivoSidebarComponent,
    DirectivoTeamsComponent,
  ],
  templateUrl: './dashboard-directivo.html',
  styleUrl: './dashboard-directivo.css',
  encapsulation: ViewEncapsulation.None,
})
export class DashboardDirectivo implements OnInit {
  totalJugadores = 0;
  totalEquipos = 0;
  totalPartidos = 0;
  totalEntrenamientos = 0;
  partidosFinalizados = 0;
  winRate = 0;
  promedioJugadoresPorEquipo = 0;
  coberturaEntrenamiento = 0;
  actividadCompetitiva = 0;

  jugadores: any[] = [];
  equipos: any[] = [];
  partidos: any[] = [];
  entrenamientos: any[] = [];

  reportes: ExecutiveReport[] = [];
  insights: Insight[] = [];
  alertas: string[] = [];
  equiposResumen: any[] = [];
  proximasActividades: any[] = [];
  actualizaciones: any[] = [];
  distribucionCategorias: any[] = [];
  tendenciaClub: ChartBar[] = [];
  mejorEquipo: any = null;
  saludInstitucional = 0;

  loading = true;
  error = '';
  sidebarOpen = false;
  activeSection: DirectivoSection = 'resumen';

  constructor(
    private authService: AuthService,
    public router: Router,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private entrenamientoService: EntrenamientoService,
    private partidoService: PartidoService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = '';

    forkJoin({
      jugadores: this.jugadorService.getJugadores().pipe(catchError(() => of([]))),
      equipos: this.equipoService.getEquipos().pipe(catchError(() => of([]))),
      entrenamientos: this.entrenamientoService.getEntrenamientos().pipe(catchError(() => of([]))),
      partidos: this.partidoService.getPartidos().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ jugadores, equipos, entrenamientos, partidos }) => {
        this.jugadores = jugadores;
        this.equipos = equipos;
        this.entrenamientos = entrenamientos;
        this.partidos = partidos;
        this.buildExecutiveSummary();
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la informacion directiva.';
        this.loading = false;
      },
    });
  }

  buildExecutiveSummary() {
    this.totalJugadores = this.jugadores.length;
    this.totalEquipos = this.equipos.length;
    this.totalEntrenamientos = this.entrenamientos.length;
    this.totalPartidos = this.partidos.length;
    this.partidosFinalizados = this.partidos.filter((partido) => this.isFinalizado(partido)).length;

    const victorias = this.partidos.filter((partido) => this.isVictoria(partido)).length;
    this.winRate = this.partidosFinalizados > 0 ? Math.round((victorias / this.partidosFinalizados) * 100) : 0;
    this.promedioJugadoresPorEquipo = this.totalEquipos > 0 ? Math.round((this.totalJugadores / this.totalEquipos) * 10) / 10 : 0;
    this.coberturaEntrenamiento = this.totalEquipos > 0 ? Math.min(100, Math.round((this.totalEntrenamientos / this.totalEquipos) * 25)) : 0;
    this.actividadCompetitiva = this.totalEquipos > 0 ? Math.round((this.totalPartidos / this.totalEquipos) * 10) / 10 : 0;

    this.equiposResumen = this.equipos.map((equipo) => {
      const jugadoresEquipo = this.jugadores.filter((jugador) => Number(jugador.equipo_id) === Number(equipo.id));
      const partidosEquipo = this.partidos.filter((partido) => Number(partido.equipo_id) === Number(equipo.id));
      const entrenamientosEquipo = this.entrenamientos.filter((entrenamiento) => Number(entrenamiento.equipo_id) === Number(equipo.id));
      const victoriasEquipo = partidosEquipo.filter((partido) => this.isVictoria(partido)).length;
      const score = jugadoresEquipo.length * 2 + entrenamientosEquipo.length * 3 + victoriasEquipo * 5 + partidosEquipo.length;

      return {
        ...equipo,
        jugadores: jugadoresEquipo.length,
        partidos: partidosEquipo.length,
        entrenamientos: entrenamientosEquipo.length,
        score,
      };
    }).sort((a, b) => b.score - a.score);

    this.mejorEquipo = this.equiposResumen[0] || null;
    this.proximasActividades = this.getUpcomingActivities();
    this.actualizaciones = this.getRecentUpdates();
    this.distribucionCategorias = this.getCategoryDistribution();
    this.tendenciaClub = this.getClubTrend();
    this.alertas = this.getStrategicAlerts();
    this.saludInstitucional = this.getInstitutionalHealth();
    this.insights = this.getInsights();
    this.reportes = this.getReports();
  }

  getStrategicAlerts(): string[] {
    const alerts: string[] = [];

    if (this.totalEquipos === 0) {
      alerts.push('No hay equipos registrados para seguimiento institucional.');
    }

    if (this.totalJugadores === 0) {
      alerts.push('No hay jugadores registrados en la base deportiva.');
    }

    if (this.totalPartidos > 0 && this.partidosFinalizados === 0) {
      alerts.push('Hay partidos registrados, pero ninguno finalizado para evaluar resultados.');
    }

    const equiposSinJugadores = this.equiposResumen.filter((equipo) => equipo.jugadores === 0).length;
    if (equiposSinJugadores > 0) {
      alerts.push(`${equiposSinJugadores} equipo(s) no tienen jugadores vinculados.`);
    }

    if (this.coberturaEntrenamiento < 50 && this.totalEquipos > 0) {
      alerts.push('La cobertura de entrenamientos esta por debajo del objetivo directivo.');
    }

    return alerts.slice(0, 4);
  }

  getInsights(): Insight[] {
    return [
      {
        icon: 'groups',
        title: 'Base deportiva',
        detail: `${this.totalJugadores} jugadores distribuidos en ${this.totalEquipos} equipos.`,
        tone: this.totalJugadores > 0 ? 'success' : 'warning',
      },
      {
        icon: 'monitoring',
        title: 'Competencia',
        detail: `${this.partidosFinalizados} de ${this.totalPartidos} partidos cuentan con cierre deportivo.`,
        tone: this.partidosFinalizados > 0 ? 'info' : 'warning',
      },
      {
        icon: 'fitness_center',
        title: 'Plan de trabajo',
        detail: `${this.totalEntrenamientos} entrenamientos registrados para control operativo.`,
        tone: this.totalEntrenamientos > 0 ? 'success' : 'warning',
      },
    ];
  }

  getReports(): ExecutiveReport[] {
    return [
      {
        title: 'Informe institucional del club',
        category: 'Directivo',
        owner: 'Direccion deportiva',
        status: this.totalEquipos > 0 ? 'Listo' : 'Requiere seguimiento',
        summary: `Consolidado de ${this.totalEquipos} equipos, ${this.totalJugadores} jugadores y ${this.totalEntrenamientos} entrenamientos.`,
        metric: `${this.promedioJugadoresPorEquipo} jugadores/equipo`,
      },
      {
        title: 'Reporte competitivo',
        category: 'Deportivo',
        owner: 'Coordinacion tecnica',
        status: this.partidosFinalizados > 0 ? 'Listo' : 'En observacion',
        summary: `Balance de partidos con efectividad general del ${this.winRate}%.`,
        metric: `${this.partidosFinalizados} finalizados`,
      },
      {
        title: 'Seguimiento de entrenamientos',
        category: 'Operacion',
        owner: 'Cuerpo tecnico',
        status: this.coberturaEntrenamiento >= 50 ? 'Listo' : 'Requiere seguimiento',
        summary: `Cobertura calculada frente al numero de equipos activos del club.`,
        metric: `${this.coberturaEntrenamiento}% cobertura`,
      },
      {
        title: 'Riesgos y prioridades',
        category: 'Gestion',
        owner: 'Directivo',
        status: this.alertas.length === 0 ? 'Listo' : 'Requiere seguimiento',
        summary: this.alertas.length > 0 ? this.alertas[0] : 'No se detectan alertas criticas con la informacion actual.',
        metric: `${this.alertas.length} alertas`,
      },
    ];
  }

  getUpcomingActivities() {
    const futureItems = [...this.partidos, ...this.entrenamientos]
      .filter((item) => item.fecha && new Date(item.fecha) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 5);

    return futureItems;
  }

  getRecentUpdates() {
    const partidos = this.partidos.slice(0, 3).map((partido) => ({
      event: 'Partido registrado',
      object: partido.nombre || partido.rival || 'Partido del club',
      status: partido.estado || 'programado',
      date: partido.fecha,
      icon: 'sports_volleyball',
    }));

    const entrenamientos = this.entrenamientos.slice(0, 3).map((entrenamiento) => ({
      event: 'Entrenamiento planificado',
      object: entrenamiento.tipo || entrenamiento.descripcion || 'Sesion de entrenamiento',
      status: entrenamiento.estado || 'activo',
      date: entrenamiento.fecha,
      icon: 'fitness_center',
    }));

    return [...partidos, ...entrenamientos]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 5);
  }

  getCategoryDistribution() {
    const categories = new Map<string, number>();

    this.equipos.forEach((equipo) => {
      const category = equipo.categoria || 'Sin categoria';
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    return Array.from(categories.entries()).map(([name, total]) => ({
      name,
      total,
      percentage: this.totalEquipos > 0 ? Math.round((total / this.totalEquipos) * 100) : 0,
    }));
  }

  getClubTrend(): ChartBar[] {
    return [
      {
        label: 'Plantilla',
        value: this.totalJugadores > 0 ? Math.min(100, Math.round((this.totalJugadores / Math.max(this.totalEquipos * 12, 1)) * 100)) : 0,
        detail: `${this.totalJugadores} jugadores`,
        color: 'blue',
      },
      {
        label: 'Entrenamiento',
        value: this.coberturaEntrenamiento,
        detail: `${this.totalEntrenamientos} sesiones`,
        color: 'green',
      },
      {
        label: 'Competencia',
        value: this.totalPartidos > 0 ? Math.min(100, Math.round((this.partidosFinalizados / this.totalPartidos) * 100)) : 0,
        detail: `${this.partidosFinalizados}/${this.totalPartidos} cerrados`,
        color: 'amber',
      },
      {
        label: 'Resultados',
        value: this.winRate,
        detail: `${this.winRate}% efectividad`,
        color: 'purple',
      },
    ];
  }

  getInstitutionalHealth() {
    const base = this.totalEquipos > 0 && this.totalJugadores > 0 ? 25 : 0;
    const training = Math.min(25, Math.round(this.coberturaEntrenamiento / 4));
    const competition = this.totalPartidos > 0 ? 20 : 0;
    const results = Math.min(20, Math.round(this.winRate / 5));
    const risk = Math.max(0, 10 - this.alertas.length * 2);

    return Math.min(100, base + training + competition + results + risk);
  }

  downloadReport(report?: ExecutiveReport) {
    const rows = [
      ['Indicador', 'Valor'],
      ['Jugadores', String(this.totalJugadores)],
      ['Equipos', String(this.totalEquipos)],
      ['Partidos', String(this.totalPartidos)],
      ['Partidos finalizados', String(this.partidosFinalizados)],
      ['Entrenamientos', String(this.totalEntrenamientos)],
      ['Win rate', `${this.winRate}%`],
      ['Cobertura entrenamientos', `${this.coberturaEntrenamiento}%`],
      ['Reporte', report?.title || 'Informe ejecutivo general'],
    ];

    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartcoach-reporte-directivo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  printReport() {
    window.print();
  }

  showSection(sectionId: DirectivoSection) {
    this.activeSection = sectionId;
    this.closeSidebar();
  }

  getReportClass(status: ReportStatus) {
    return {
      'status-ready': status === 'Listo',
      'status-watch': status === 'En observacion',
      'status-risk': status === 'Requiere seguimiento',
    };
  }

  isFinalizado(partido: any) {
    return String(partido.estado || '').toLowerCase() === 'finalizado';
  }

  isVictoria(partido: any) {
    const ganador = String(partido.ganador || partido.resultado || '').toLowerCase();
    return ganador === 'equipo' || ganador === 'victoria' || ganador === 'ganado';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
