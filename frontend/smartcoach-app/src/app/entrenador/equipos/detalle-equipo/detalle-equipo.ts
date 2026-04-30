import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { Equipo } from '../../../models/equipo.model';
import { Jugador } from '../../../models/jugador.model';
import { AuthService } from '../../../services/auth/auth-service';
import { ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-detalle-equipo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-equipo.html',
  styleUrl: './detalle-equipo.css'
})
export class DetalleEquipo implements OnInit {
  equipo: Equipo | null = null;
  jugadores: Jugador[] = [];
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipoService: EquipoService,
    private jugadorService: JugadorService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEquipo();
  }

  loadEquipo(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de equipo no válido';
      return;
    }

    this.loading = true;
    this.error = '';

    forkJoin({
      equipo: this.equipoService.getEquipo(id),
      jugadores: this.jugadorService.getJugadoresByEquipo(id)
    }).subscribe({
      next: ({ equipo, jugadores }) => {
        this.equipo = equipo as Equipo;
        this.jugadores = jugadores;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error loading equipo:', err);
        this.error = 'Error al cargar el equipo';
        this.loading = false;
      }
    }); 
  }

  getYearsActive(): string {
    if (!this.equipo?.ano_fundacion) return '';
    return (new Date().getFullYear() - this.equipo.ano_fundacion).toString();
  }

  back(): void {
    this.router.navigate(['/ver-equipos-e']);
  }

  editar(): void {
    if (this.equipo?.id) {
      this.router.navigate(['/editar-equipo', this.equipo.id]);
    }
  }

  eliminar(): void {
    if (!this.equipo?.id || !confirm('¿Deseas eliminar este equipo?')) return;

    this.equipoService.eliminarEquipo(this.equipo.id).subscribe({
      next: () => {
        alert('Equipo eliminado correctamente');
        this.back();
      },
      error: () => {
        alert('Error al eliminar el equipo');
      }
    });
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
