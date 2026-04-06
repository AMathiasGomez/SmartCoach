import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../../services/partido/partido-service';
import { Equipo } from '../../../models/equipo.model';

@Component({
  selector: 'app-ver-partidos',
  imports: [RouterLink, CommonModule],
  templateUrl: './ver-partidos.html',
  styleUrl: './ver-partidos.css',
})
export class VerPartidos {

  equipos: Equipo[] = [];
  partidos: any[] = [];
  loading = true;

  constructor(
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private partidoService: PartidoService
  ) {}

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


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}