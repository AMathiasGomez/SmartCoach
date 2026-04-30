import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { Equipo } from '../../../models/equipo.model';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-ver-equipos-e',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './ver-equipos-e.html',
  styleUrl: './ver-equipos-e.css',
})
export class VerEquiposE {

  loading = false;
  equipos: Equipo[] = [];

  private baseUrl = 'http://localhost:3006';

  constructor(
    private equipoService: EquipoService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarEquipos();
  }

  cargarEquipos(): void {
    console.log('Cargando equipos...');
    this.loading = true;

    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        console.log('Datos recibidos del servicio:', data);
        this.equipos = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar equipos', err);
        alert('Error al cargar equipos');
        this.loading = false;
      },
    });
  }

  getFotoEquipo(fotoUrl?: string): string {
    if (!fotoUrl) {
      return '';
    }

    if (fotoUrl.startsWith('http')) {
      return fotoUrl;
    }

    return `${this.baseUrl}${fotoUrl}`;
  }

  editar(id: number): void {
    this.router.navigate(['/editar-equipo', id]);
  }

  eliminar(id: number): void {
    if (confirm('¿Eliminar equipo?')) {
      this.equipoService.eliminarEquipo(id).subscribe({
        next: () => {
          alert('Equipo eliminado');
          this.cargarEquipos();
        },
        error: () => {
          alert('Error al eliminar');
        },
      });
    }
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
