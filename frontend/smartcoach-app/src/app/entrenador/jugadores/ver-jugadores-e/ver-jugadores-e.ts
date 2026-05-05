import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Jugador } from '../../../models/jugador.model';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ver-jugadores-e',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './ver-jugadores-e.html',
  styleUrl: './ver-jugadores-e.css',
})
export class VerJugadoresE implements OnInit {

  loading = false;
  jugadores: Jugador[] = [];
  filtroNombre = '';
  filtroPosicion = '';
  filtroEquipo = '';
  jugadoresFiltrados: Jugador[] = [];
  posiciones: string[] = [];
  equipos: string[] = [];

  constructor(
    private jugadorService: JugadorService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarJugadores();
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

    this.jugadoresFiltrados = this.jugadores.filter(j =>
      (!nombre || j.nombre.toLowerCase().includes(nombre)) &&
      (!posicion || j.posicion === posicion) &&
      (!equipo || j.equipo_nombre === equipo)
    );
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroPosicion = '';
    this.filtroEquipo = '';
    this.jugadoresFiltrados = [...this.jugadores];
  }

  hayFiltrosActivos(): boolean {
    return !!(this.filtroNombre || this.filtroPosicion || this.filtroEquipo);
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
