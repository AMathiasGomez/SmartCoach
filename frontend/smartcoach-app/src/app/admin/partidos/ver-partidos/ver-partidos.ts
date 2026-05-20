import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../../services/partido/partido-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ver-partidos',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './ver-partidos.html',
  styleUrl: './ver-partidos.css',
})
export class VerPartidos {

  partidos: any[] = [];
  partidosFiltrados: any[] = [];
  equipos: string[] = [];
  loading = true;

  filtroNombre = '';
  filtroEquipo = '';
  filtroEstado = '';

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

        this.equipos = [
          ...new Set(
            data
              .map(p => p.equipo_nombre)
              .filter((e): e is string => !!e)
          )
        ].sort();

        this.loading = false;
        this.cd.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  aplicarFiltros() {

    const nombre = this.filtroNombre.toLowerCase().trim();
    const equipo = this.filtroEquipo;
    const estado = this.filtroEstado;

    this.partidosFiltrados = this.partidos.filter(p => {

      const matchNombre =
        !nombre ||
        p.nombre?.toLowerCase().includes(nombre);

      const matchEquipo =
        !equipo ||
        p.equipo_nombre === equipo;

      const matchEstado =
        !estado ||
        p.estado === estado;

      return matchNombre && matchEquipo && matchEstado;
    });
  }

  limpiarFiltros() {

    this.filtroNombre = '';
    this.filtroEquipo = '';
    this.filtroEstado = '';

    this.partidosFiltrados = [...this.partidos];
  }

  hayFiltrosActivos(): boolean {
    return !!(
      this.filtroNombre ||
      this.filtroEquipo ||
      this.filtroEstado
    );
  }

  irDetalle(id: number) {
    this.router.navigate(['/detalle-partido', id]);
  }

  editar(id: number): void {
    this.router.navigate(['/editar-partido', id]);
  }

  getEstado(estado: string) {
    switch (estado) {
      case 'pendiente': return 'badge pendiente';
      case 'en_curso': return 'badge curso';
      case 'finalizado': return 'badge finalizado';
      default: return 'badge';
    }
  }

  eliminar(id: number) {

    if (confirm('¿Deseas eliminar este partido?')) {

      this.partidoService.deletePartido(id).subscribe({

        next: () => {
          alert('Partido eliminado');
          this.cargarPartidos();
        },

        error: () => {
          alert('Error al eliminar');
        }
      });
    }
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}