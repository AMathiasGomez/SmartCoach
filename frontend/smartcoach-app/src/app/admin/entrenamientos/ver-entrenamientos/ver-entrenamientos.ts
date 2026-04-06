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
  imports: [RouterLink, NgClass, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './ver-entrenamientos.html',
  styleUrl: './ver-entrenamientos.css',
})
export class VerEntrenamientos implements OnInit {

   loading = false;

  // 📊 DATA
  entrenamientos: any[] = [];
  entrenamientosOriginal: any[] = [];

  equipos: Equipo[] = [];

  // 🔍 FILTROS
  filtroEquipo: string = '';
  filtroFecha: string = '';
  filtroEstado: string = '';

  // 📈 STATS
  totalEntrenamientos: number = 0;
  entrenamientosSemana: number = 0;

  constructor(
    private entrenamientoService: EntrenamientoService,
    private equipoService: EquipoService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarEntrenamientos();
    this.cargarEquipos();
  }

  // 🔥 CARGAR ENTRENAMIENTOS
  cargarEntrenamientos() {

  }

  // 🔥 CARGAR EQUIPOS (para filtros)
  cargarEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        this.equipos = data;
      },
      error: () => {
        console.error('Error al cargar equipos');
      }
    });
  }

  // 🔍 FILTRAR
  filtrar() {
    this.entrenamientos = this.entrenamientosOriginal.filter(e => {

      const cumpleEquipo =
        !this.filtroEquipo || e.equipo_id == this.filtroEquipo;

      const cumpleFecha =
        !this.filtroFecha || e.fecha.includes(this.filtroFecha);

      const cumpleEstado =
        !this.filtroEstado || e.estado === this.filtroEstado;

      return cumpleEquipo && cumpleFecha && cumpleEstado;
    });
  }

  // 📊 STATS
  calcularStats() {
    this.totalEntrenamientos = this.entrenamientos.length;

    const hoy = new Date();
    const hace7dias = new Date();
    hace7dias.setDate(hoy.getDate() - 7);

    this.entrenamientosSemana = this.entrenamientos.filter(e => {
      const fecha = new Date(e.fecha);
      return fecha >= hace7dias && fecha <= hoy;
    }).length;
  }

  // ✏️ EDITAR
  editar(id: number) {
    this.router.navigate(['/editar-entrenamiento', id]);
  }

  // 🗑 ELIMINAR
  eliminar(id: number) {

  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
