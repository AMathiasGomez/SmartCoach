import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Equipo } from '../../../models/equipo.model';

import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';
import { EquipoService } from '../../../services/equipo/equipo-service';

@Component({
  selector: 'app-ver-entrenamientos',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    ReactiveFormsModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './ver-entrenamientos.html',
  styleUrls: ['./ver-entrenamientos.css'],
})
export class VerEntrenamientos implements OnInit {

  loading = false;

  entrenamientos: any[] = [];
  entrenamientosFiltrados: any[] = [];

  equipos: string[] = [];
  tiposEntrenamiento: string[] = [];

  filtroEquipo = '';
  filtroFecha = '';
  filtroTipo = '';

  totalEntrenamientos = 0;
  entrenamientosSemana = 0;

  constructor(
    private entrenamientoService: EntrenamientoService,
    private equipoService: EquipoService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarEntrenamientos();
  }

  cargarEntrenamientos() {

    console.log("cargando entrenamientos...");

    this.loading = true;

    this.entrenamientoService.getEntrenamientos().subscribe({

      next: (data) => {

        this.entrenamientos = data;

        // Equipos únicos
        this.equipos = [
          ...new Set(
            data
              .map(e => e.equipo_nombre)
              .filter((e): e is string => !!e)
          )
        ].sort();

        // Tipos únicos
        this.tiposEntrenamiento = [
          ...new Set(
            data
              .map(e => e.tipo)
              .filter((t): t is string => !!t)
          )
        ].sort();

        this.entrenamientosFiltrados = data;

        this.totalEntrenamientos = data.length;

        this.calcularSemana();

        this.loading = false;

        this.cd.detectChanges();
      },

      error: (err) => {

        console.error('Error al cargar entrenamientos', err);

        alert('Error al cargar entrenamientos');

        this.loading = false;
      }
    });
  }

  aplicarFiltros() {

  const equipo = this.filtroEquipo.toLowerCase().trim();
  const fecha = this.filtroFecha;
  const tipo = this.filtroTipo;

  this.entrenamientosFiltrados = this.entrenamientos.filter(e => {

    // FILTRO EQUIPO
    const matchEquipo =
      !equipo ||
      e.equipo_nombre?.toLowerCase().includes(equipo);

    // FILTRO FECHA (FIX REAL)
    const fechaFormateada = e.fecha
      ? e.fecha.split('T')[0]
      : '';

    const matchFecha =
      !fecha ||
      fechaFormateada === fecha;

    // FILTRO TIPO
    const matchTipo =
      !tipo ||
      e.tipo === tipo;

    return matchEquipo && matchFecha && matchTipo;
  });
}

  limpiarFiltros() {

    this.filtroEquipo = '';
    this.filtroFecha = '';
    this.filtroTipo = '';

    this.entrenamientosFiltrados = [...this.entrenamientos];
  }

  hayFiltrosActivos(): boolean {

    return !!(
      this.filtroEquipo ||
      this.filtroFecha ||
      this.filtroTipo
    );
  }

  calcularSemana() {

    const hoy = new Date();

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);

    this.entrenamientosSemana =
      this.entrenamientos.filter(e => {

        const fecha = new Date(e.fecha);

        return fecha >= inicioSemana &&
               fecha <= finSemana;

      }).length;
  }

  editar(id: number) {
    this.router.navigate(['/editar-entrenamiento', id]);
  }

  esEntrenamientoCompletado(entrenamiento: any): boolean {
    return String(entrenamiento?.estado || '').trim().toLowerCase() === 'completado';
  }

  eliminar(id: number) {

    if (confirm('¿Deseas eliminar este entrenamiento?')) {

      this.entrenamientoService.deleteEntrenamiento(id).subscribe({

        next: () => {

          alert('Entrenamiento eliminado');

          this.cargarEntrenamientos();
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
