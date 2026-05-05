import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { PartidoService } from '../../../services/partido/partido-service';
import { Jugador } from '../../../models/jugador.model';
import { AuthService } from '../../../services/auth/auth-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-detalle-jugador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-jugador.html',
  styleUrl: './detalle-jugador.css'
})
export class DetalleJugador implements OnInit {
  jugador: Jugador | null = null;
  loading = false;
  error = '';
  stats: any = null;
  statsLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jugadorService: JugadorService,
    private partidoService: PartidoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadJugador();
  }

  loadJugador(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de jugador no válido';
      return;
    }

    this.loading = true;
    this.error = '';

    this.jugadorService.getJugador(id).subscribe({
      next: (data) => {
        this.jugador = data as Jugador;
        this.loading = false;
        this.loadEstadisticas(id);
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error loading jugador:', err);
        this.error = 'Error al cargar el jugador';
        this.loading = false;
      }
    });
  }

  loadEstadisticas(jugadorId: number): void {
    this.statsLoading = true;
    this.partidoService.getEstadisticasJugador(jugadorId).subscribe({
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error loading stats:', err);
        this.stats = null;
        this.statsLoading = false;
      }
    });
  }

  calculateAge(): string {
    if (!this.jugador?.fecha_nacimiento) return '';
    const birthDate = new Date(this.jugador.fecha_nacimiento);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
  }

  back(): void {
    this.router.navigate(['/ver-jugadores-e']);
  }

  editar(): void {
    if (this.jugador?.id) {
      this.router.navigate(['/editar-jugador', this.jugador.id]);
    }
  }

  eliminar(): void {
    if (!this.jugador?.id || !confirm('¿Deseas eliminar este jugador?')) return;

    this.jugadorService.eliminarJugador(this.jugador.id).subscribe({
      next: () => {
        alert('Jugador eliminado correctamente');
        this.back();
      },
      error: () => {
        alert('Error al eliminar el jugador');
      }
    });
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
