import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Equipo } from '../../../models/equipo.model';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ver-equipos',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './ver-equipos.html',
  styleUrls: ['./ver-equipos.css'],
})
export class VerEquipos implements OnInit {
  loading = false;
  equipos: Equipo[] = [];

  constructor(
    private equipoService: EquipoService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarEquipos();
  }

  cargarEquipos() {
    console.log("cargando equipos...");

    this.loading = true;

    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        console.log("datos recibidos del servicio:", data);
        this.equipos = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar equipos', err);
        alert('Error al cargar equipos');
        this.loading = false;
      }
    });
  }

  editar(id: number) {
    this.router.navigate(['/editar-equipo', id]);
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar equipo?')) {
      this.equipoService.eliminarEquipo(id).subscribe({
        next: () => {
          alert('Equipo eliminado');
          this.cargarEquipos();
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
