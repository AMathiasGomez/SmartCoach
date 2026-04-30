import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';
import { AuthService } from '../../../services/auth/auth-service';
import { Jugador } from '../../../models/jugador.model';

@Component({
  selector: 'app-ver-entrenamientos-e',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-entrenamientos-e.html',
  styleUrl: './ver-entrenamientos-e.css',
})
export class VerEntrenamientosE implements OnInit {
  entrenamientos: any[] = [];
  loading = true;

  constructor(
    private entrenamientoService: EntrenamientoService,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadEntrenamientos();
  }

  loadEntrenamientos() {
    this.loading = true;
    this.entrenamientoService.getEntrenamientos().subscribe({
      next: (data: any[]) => {
        this.entrenamientos = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        alert('Error al cargar entrenamientos');
        this.loading = false;
      }
    });
  }

  verDetalle(id: number) {
    this.router.navigate(['/detalle-entrenamiento', id]);
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
