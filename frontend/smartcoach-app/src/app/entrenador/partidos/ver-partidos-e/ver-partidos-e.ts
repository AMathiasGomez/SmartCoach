import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { PartidoService } from '../../../services/partido/partido-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ver-partidos-e',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './ver-partidos-e.html',
  styleUrl: './ver-partidos-e.css',
})
export class VerPartidosE implements OnInit {

  partidos: any[] = [];
  partidosFiltrados: any[] = [];

  loading = true;
  sidebarOpen = false;

  // FILTROS (igual estilo entrenamientos)
  filtroNombre = '';
  filtroEquipo = '';
  filtroEstado = '';
  filtroResultado = '';

  get partidosFinalizados(): number {
    return this.partidos.filter((partido) => partido.estado === 'finalizado').length;
  }

  get partidosPendientes(): number {
    return this.partidos.filter((partido) => partido.estado !== 'finalizado').length;
  }

  get victoriasMes(): number {
    const hoy = new Date();

    return this.partidos.filter((partido) => {
      const fecha = partido.fecha ? new Date(partido.fecha) : null;

      return (
        partido.estado === 'finalizado' &&
        partido.ganador === 'equipo' &&
        fecha &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    }).length;
  }

  constructor(
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private partidoService: PartidoService
  ) {}

  ngOnInit(): void {
    this.cargarPartidos();
  }

  cargarPartidos() {

    this.loading = true;

    this.partidoService.getPartidos().subscribe({

      next: (data) => {

        this.partidos = data;
        this.partidosFiltrados = data;

        this.loading = false;
        this.cd.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  filtrarPartidos() {

    const nombre = this.filtroNombre.toLowerCase().trim();
    const equipo = this.filtroEquipo.toLowerCase().trim();
    const estado = this.filtroEstado;
    const resultadoFiltro = this.filtroResultado;

    this.partidosFiltrados = this.partidos.filter((partido) => {

      // RESULTADO (calculado)
      let resultado = '';

      if (partido.estado === 'finalizado') {
        resultado =
          partido.ganador === 'equipo'
            ? 'Victoria'
            : 'Derrota';
      }

      const matchNombre =
        !nombre ||
        partido.nombre?.toLowerCase().includes(nombre);

      const matchEquipo =
        !equipo ||
        partido.equipo_nombre?.toLowerCase().includes(equipo);

      const matchEstado =
        !estado ||
        partido.estado === estado;

      const matchResultado =
        !resultadoFiltro ||
        resultado === resultadoFiltro;

      return (
        matchNombre &&
        matchEquipo &&
        matchEstado &&
        matchResultado
      );
    });
  }

  limpiarFiltros() {

    this.filtroNombre = '';
    this.filtroEquipo = '';
    this.filtroEstado = '';
    this.filtroResultado = '';

    this.partidosFiltrados = [...this.partidos];
  }

  hayFiltrosActivos(): boolean {

    return !!(
      this.filtroNombre ||
      this.filtroEquipo ||
      this.filtroEstado ||
      this.filtroResultado
    );
  }

  irDetalle(id: number) {
    this.router.navigate(['/detalle-partido', id]);
  }

  getEstado(estado: string) {

    switch (estado) {

      case 'pendiente':
        return 'badge pendiente';

      case 'en_curso':
        return 'badge curso';

      case 'finalizado':
        return 'badge finalizado';

      default:
        return 'badge';
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'match-pending';
      case 'en_curso':
        return 'match-live';
      case 'finalizado':
        return 'match-finished';
      default:
        return 'match-default';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_curso':
        return 'En curso';
      case 'finalizado':
        return 'Finalizado';
      default:
        return 'Sin estado';
    }
  }

  getScoreLabel(partido: any): string {
    if (partido.estado !== 'finalizado') {
      return 'VS';
    }

    return partido.ganador === 'equipo' ? 'W' : 'L';
  }

  getResultadoLabel(partido: any): string {
    if (partido.estado === 'finalizado') {
      return partido.ganador === 'equipo'
        ? 'Análisis de rendimiento completado'
        : 'Revisión táctica disponible';
    }

    if (partido.estado === 'en_curso') {
      return 'Preparación en curso';
    }

    return 'Encuentro por gestionar';
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
}
