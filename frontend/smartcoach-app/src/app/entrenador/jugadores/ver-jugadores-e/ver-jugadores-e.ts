import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Jugador } from '../../../models/jugador.model';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface PlayerClassificationLite {
  nivel: 'Alto' | 'Medio' | 'Bajo';
  combined_score: number;
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
    private authService: AuthService,
    private http: HttpClient
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
    const teamIds = [...new Set(jugadores.map(j => j.equipo_id).filter((id): id is number => !!id))];

    if (!teamIds.length) {
      return;
    }

    this.loadingClasificaciones = true;

    forkJoin(
      teamIds.map(teamId =>
        this.http.get<any>(`${environment.apiUrl}/analysis/classify-general?team_id=${teamId}`).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe({
      next: (results) => {
        const map: Record<string, PlayerClassificationLite> = {};

        results.forEach((res) => {
          const players = res?.data?.classification || res?.classification || [];
          players.forEach((player: any) => {
            map[String(player.player_id)] = {
              nivel: player.nivel,
              combined_score: Number(player.combined_score) || 0
            };
          });
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

  getFotoUrl(fotoUrl?: string): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    const path = fotoUrl.startsWith('/uploads') ? fotoUrl : `/uploads/jugadores/${fotoUrl}`;
    return `${this.baseUrl}${path}`;
  }

  getJugadorNivel(jugador: Jugador): 'Alto' | 'Medio' | 'Bajo' | 'Sin datos' {
    if (!jugador.id) return 'Sin datos';
    return this.clasificacionPorJugador[String(jugador.id)]?.nivel || 'Sin datos';
  }

  getJugadorScore(jugador: Jugador): number | null {
    if (!jugador.id) return null;
    return this.clasificacionPorJugador[String(jugador.id)]?.combined_score ?? null;
  }

  getNivelClass(jugador: Jugador): string {
    return `nivel-${this.getJugadorNivel(jugador).toLowerCase().replace(' ', '-')}`;
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
