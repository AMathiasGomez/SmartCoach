import { ChangeDetectorRef, Component } from '@angular/core';
import { Equipo } from '../../../models/equipo.model';
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
export class VerPartidosE {
  
  equipos: Equipo[] = [];
  partidos: any[] = [];
  loading = true;

  constructor(
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private partidoService: PartidoService
  ) { }

  ngOnInit(): void {
    this.cargarPartidos();
  }

  cargarPartidos() {
    this.partidoService.getPartidos().subscribe({
      next: (data) => {
        this.partidos = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  irDetalle(id: number) {
    this.router.navigate(['/detalle-partido', id]);
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
