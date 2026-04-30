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
  ) { }

  ngOnInit(): void {
    this.cargarEntrenamientos();
    this.cargarEquipos();
  }

  cargarEntrenamientos() {
    this.entrenamientoService.getEntrenamientos().subscribe({
      next: (data) => {
        this.entrenamientos = data;
        this.entrenamientosOriginal = data;
        this.loading = false;

        this.totalEntrenamientos = data.length;
        this.calcularSemana();
        this.cd.detectChanges()
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

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

  filtrar() {
    this.entrenamientos = this.entrenamientosOriginal.filter(e => {

      const matchEquipo = this.filtroEquipo ? e.equipo_id == this.filtroEquipo : true;
      const matchFecha = this.filtroFecha ? e.fecha === this.filtroFecha : true;
      const matchEstado = this.filtroEstado ? e.estado === this.filtroEstado : true;

      return matchEquipo && matchFecha && matchEstado;
    });
  }

  calcularSemana() {
    const hoy = new Date();
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);

    this.entrenamientosSemana = this.entrenamientosOriginal.filter(e => {
      const fecha = new Date(e.fecha);
      return fecha >= inicioSemana && fecha <= finSemana;
    }).length;
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
