import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-ver-entrenamientos-e',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ver-entrenamientos-e.html',
  styleUrl: './ver-entrenamientos-e.css',
})
export class VerEntrenamientosE implements OnInit {

  entrenamientos: any[] = [];
  entrenamientosFiltrados: any[] = [];

  loading = true;
  sidebarOpen = false;

  tiposEntrenamiento: string[] = [];

  filtroEquipo = '';
  filtroFecha = '';
  filtroTipo = '';
  filtroEstado = '';

  constructor(
    private entrenamientoService: EntrenamientoService,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadEntrenamientos();
  }

  loadEntrenamientos() {

    this.loading = true;

    this.entrenamientoService.getEntrenamientos().subscribe({

      next: (data: any[]) => {

        this.entrenamientos = data;
        this.entrenamientosFiltrados = data;

        this.tiposEntrenamiento = [
          ...new Set(
            data
              .map(e => e.tipo)
              .filter((t): t is string => !!t)
          )
        ].sort();

        this.loading = false;
        this.cd.detectChanges();
      },

      error: () => {
        alert('Error al cargar entrenamientos');
        this.loading = false;
      }
    });
  }

  aplicarFiltros() {

    const equipo = this.filtroEquipo.toLowerCase().trim();
    const fecha = this.filtroFecha;
    const tipo = this.filtroTipo;
    const estado = this.filtroEstado;

    this.entrenamientosFiltrados = this.entrenamientos.filter(e => {

      const matchEquipo =
        !equipo ||
        e.equipo_nombre?.toLowerCase().includes(equipo);

      const matchFecha =
  !fecha ||
  new Date(e.fecha).toISOString().split('T')[0] === fecha;

      const matchTipo =
        !tipo ||
        e.tipo === tipo;

      const matchEstado =
        !estado ||
        e.estado === estado;

      return matchEquipo && matchFecha && matchTipo && matchEstado;
    });
  }

  limpiarFiltros() {

    this.filtroEquipo = '';
    this.filtroFecha = '';
    this.filtroTipo = '';
    this.filtroEstado = '';

    this.entrenamientosFiltrados = [...this.entrenamientos];
  }

  hayFiltrosActivos(): boolean {

    return !!(
      this.filtroEquipo ||
      this.filtroFecha ||
      this.filtroTipo ||
      this.filtroEstado
    );
  }

  verDetalle(id: number) {
    this.router.navigate(['/detalle-entrenamiento', id]);
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'programado': return 'Programado';
      case 'en_curso': return 'En curso';
      case 'completado': return 'Completado';
      default: return estado;
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'programado': return 'training-pending';
      case 'en_curso': return 'training-live';
      case 'completado': return 'training-finished';
      default: return '';
    }
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