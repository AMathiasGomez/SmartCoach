import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Equipo } from '../../../models/equipo.model';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { AuthService } from '../../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

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
  filtroNombre = '';
  filtroCategoria = '';
  equiposFiltrados: Equipo[] = [];
  categorias: string[] = [];


  private baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

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
        this.equipos = data;
        this.categorias = [...new Set(data.map(e => e.categoria).filter(Boolean))].sort();
        this.equiposFiltrados = data;
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

  aplicarFiltros() {
    const nombre = this.filtroNombre.toLowerCase().trim();
    const categoria = this.filtroCategoria;

    this.equiposFiltrados = this.equipos.filter(e =>
      (!nombre || e.nombre.toLowerCase().includes(nombre)) &&
      (!categoria || e.categoria === categoria)
    );
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.equiposFiltrados = [...this.equipos];
  }

  hayFiltrosActivos(): boolean {
    return !!(this.filtroNombre || this.filtroCategoria);
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
