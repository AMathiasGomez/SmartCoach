import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { CommonModule } from '@angular/common';
import { Jugador } from '../../../models/jugador.model';

@Component({
  selector: 'app-ver-jugadores',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './ver-jugadores.html',
  styleUrls: ['./ver-jugadores.css'],
})
export class VerJugadores implements OnInit {

  private apiBaseUrl = 'https://smartcoach-production.up.railway.app';
  loading = false;
  jugadores: Jugador[] = [];

  constructor(
    private jugadorService: JugadorService,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarJugadores();
  }

  cargarJugadores() {
    console.log("cargando jugadores...");

    this.loading = true;

    this.jugadorService.getJugadores().subscribe({
      next: (data) => {
        console.log("datos recibidos del servicio:", data);
        this.jugadores = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar jugadores', err);
        alert('Error al cargar jugadores');
        this.loading = false;
      }
    });
  }

  editar(id: number) {
    this.router.navigate(['/editar-jugador', id]);
  }

  eliminar(id: number) {
    if (confirm('¿Deseas eliminar este jugador?')) {
      this.jugadorService.eliminarJugador(id).subscribe({
        next: () => {
          alert('Jugador eliminado');
          this.cargarJugadores();
        },
        error: () => {
          alert('Error al eliminar');
        }
      });
    }
  }

  getFotoUrl(fotoUrl: string | undefined): string {
    if (!fotoUrl || fotoUrl.trim() === '') {
      return '';
    }
    // Already full URL (from external source)
    if (fotoUrl.startsWith('http')) {
      return fotoUrl;
    }
    // Relative path - prepend API base URL
    return this.apiBaseUrl + fotoUrl;
  }

  hasPhoto(jugador: Jugador): boolean {
    return !!jugador.foto_url && jugador.foto_url.trim() !== '';
  }

  // Handle image error - instead of hiding, show default avatar
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Hide the failed image
    img.style.display = 'none';
  }

  // Get initials for default avatar
  getInitials(nombre: string): string {
    if (!nombre) return '?';
    return nombre.charAt(0).toUpperCase();
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
