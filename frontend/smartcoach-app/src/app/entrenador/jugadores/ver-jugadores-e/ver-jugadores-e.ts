import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Jugador } from '../../../models/jugador.model';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface PlayerClassificationLite {
  nivel: 'Alto' | 'Medio' | 'Bajo';
  overall_score_100: number;
}

@Component({
  selector: 'app-ver-jugadores-e',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './ver-jugadores-e.html',
  styleUrls: ['./ver-jugadores-e.css'],
})
export class VerJugadoresE implements OnInit {

  sidebarOpen = false;
  loading = false;
  jugadores: Jugador[] = [];
  filtroNombre = '';
  filtroPosicion = '';
  filtroEquipo = '';
  filtroRendimiento = '';
  jugadoresFiltrados: Jugador[] = [];
  posiciones: string[] = [];
  equipos: string[] = [];
  loadingClasificaciones = false;
  clasificacionPorJugador: Record<string, PlayerClassificationLite> = {};
  private baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private jugadorService: JugadorService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarJugadores();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  cargarJugadores() {
    console.log("cargando jugadores...");

    this.loading = true;

    this.jugadorService.getJugadores().subscribe({
      next: (data) => {
        this.jugadores = data;
        this.posiciones = [...new Set(data.map(j => j.posicion).filter((p): p is string => !!p))].sort();
        this.equipos = [...new Set(data.map(j => j.equipo_nombre).filter((e): e is string => !!e))].sort();
        this.jugadoresFiltrados = data;
        this.loading = false;
        this.cargarClasificaciones(data);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar jugadores', err);
        alert('Error al cargar jugadores');
        this.loading = false;
      }
    });
  }

  editar(id: number) {
    this.router.navigate(['/editar-jugador', id]);
  }

  eliminar(id: number) {
    if (confirm('¿Deseas eliminar este jugador?')) {
      this.jugadorService.eliminarJugador(id).subscribe({
        next: () => {
          alert('Jugador eliminado');
          this.cargarJugadores();
        },
        error: () => {
          alert('Error al eliminar');
        }
      });
    }
  }

  aplicarFiltros() {
    const nombre = this.filtroNombre.toLowerCase().trim();
    const posicion = this.filtroPosicion;
    const equipo = this.filtroEquipo;
    const rendimiento = this.filtroRendimiento;

    this.jugadoresFiltrados = this.jugadores.filter(j =>
      (!nombre || j.nombre.toLowerCase().includes(nombre)) &&
      (!posicion || j.posicion === posicion) &&
      (!equipo || j.equipo_nombre === equipo) &&
      (!rendimiento || this.getJugadorNivel(j) === rendimiento)
    );
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroPosicion = '';
    this.filtroEquipo = '';
    this.filtroRendimiento = '';
    this.jugadoresFiltrados = [...this.jugadores];
  }

  hayFiltrosActivos(): boolean {
    return !!(this.filtroNombre || this.filtroPosicion || this.filtroEquipo || this.filtroRendimiento);
  }

  cargarClasificaciones(jugadores: Jugador[]): void {
    const jugadoresConId = jugadores.filter((j): j is Jugador & { id: number } => !!j.id);

    if (!jugadoresConId.length) {
      return;
    }

    this.loadingClasificaciones = true;

    forkJoin(
      jugadoresConId.map(jugador =>
        this.jugadorService.getPlayerAnalytics(jugador.id).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe({
      next: (results: any[]) => {
        const map: Record<string, PlayerClassificationLite> = {};

        results.forEach((res, index) => {
          const analysis = res?.analysis;
          if (!analysis) return;

          const score100 = analysis.overall_score_100 ?? (analysis.overall_score || 0) * 10;

          map[String(jugadoresConId[index].id)] = {
            nivel: this.mapNivelToTier(analysis.nivel, score100),
            overall_score_100: Number(score100) || 0
          };
        });

        this.clasificacionPorJugador = map;
        this.loadingClasificaciones = false;
        this.aplicarFiltros();
        this.cd.detectChanges();
      },
      error: () => {
        this.loadingClasificaciones = false;
        this.cd.detectChanges();
      }
    });
  }

  private mapNivelToTier(nivel: string, score100: number): 'Alto' | 'Medio' | 'Bajo' {
    switch (nivel) {
      case 'Excelente':
      case 'Bueno':
        return 'Alto';
      case 'Regular':
        return 'Medio';
      case 'Bajo':
      case 'Crítico':
        return 'Bajo';
      default:
        return score100 >= 70 ? 'Alto' : score100 >= 40 ? 'Medio' : 'Bajo';
    }
  }

  getFotoUrl(fotoUrl?: string): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    const path = fotoUrl.startsWith('/uploads') ? fotoUrl : `/uploads/jugadores/${fotoUrl}`;
    return `${this.baseUrl}${path}`;
  }

  hasPhoto(jugador: Jugador): boolean {
    return !!jugador.foto_url && jugador.foto_url.trim() !== '' && !(jugador as any).fotoError;
  }

  onImageError(jugador: Jugador): void {
    (jugador as any).fotoError = true;
    this.cd.detectChanges();
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    return nombre.charAt(0).toUpperCase();
  }

  getJugadorNivel(jugador: Jugador): 'Alto' | 'Medio' | 'Bajo' | 'Sin datos' {
    if (!jugador.id) return 'Sin datos';
    return this.clasificacionPorJugador[String(jugador.id)]?.nivel || 'Sin datos';
  }

  getJugadorScore(jugador: Jugador): number | null {
    if (!jugador.id) return null;
    return this.clasificacionPorJugador[String(jugador.id)]?.overall_score_100 ?? null;
  }

  getJugadorScorePercent(jugador: Jugador): number {
    const score = this.getJugadorScore(jugador);

    if (score === null) return 0;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getJugadorEdad(jugador: Jugador): number | string {
    if (!jugador.fecha_nacimiento) return '-';

    const birthDate = new Date(jugador.fecha_nacimiento);

    if (Number.isNaN(birthDate.getTime())) return '-';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getPerformanceTrendIcon(jugador: Jugador): string {
    const nivel = this.getJugadorNivel(jugador);

    if (nivel === 'Bajo') return 'trending_flat';
    if (nivel === 'Sin datos') return 'remove';
    return 'trending_up';
  }

  getNivelClass(jugador: Jugador): string {
    return `nivel-${this.getJugadorNivel(jugador).toLowerCase().replace(' ', '-')}`;
  }

  getPositionClass(posicion?: string): string {
    const normalizedPosition = (posicion || '').toLowerCase();

    if (normalizedPosition.includes('punta')) return 'position-punta';
    if (normalizedPosition.includes('opuesto')) return 'position-opuesto';
    if (normalizedPosition.includes('central')) return 'position-central';
    if (normalizedPosition.includes('armador')) return 'position-armador';
    if (normalizedPosition.includes('libero') || normalizedPosition.includes('líbero')) return 'position-libero';
    return 'position-default';
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
