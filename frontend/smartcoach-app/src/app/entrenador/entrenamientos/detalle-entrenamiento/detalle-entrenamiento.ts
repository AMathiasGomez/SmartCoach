import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';
import { AuthService } from '../../../services/auth/auth-service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-detalle-entrenamiento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './detalle-entrenamiento.html',
  styleUrl: './detalle-entrenamiento.css'
})
export class DetalleEntrenamiento implements OnInit {
  entrenamiento: any = null;
  jugadores: any[] = [];
  loading = false;
  saving = false;
  error = '';
  success = '';

  id!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entrenamientoService: EntrenamientoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEntrenamiento();
  }

  loadEntrenamiento() {
    this.loading = true;
    this.entrenamientoService.getEntrenamiento(this.id).subscribe({
      next: (data: any) => {
        this.entrenamiento = data;
        this.jugadores = data.jugadores || [];
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Error al cargar entrenamiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  saveAsistencia() {
    this.saving = true;
    this.success = '';
    this.error = '';

    const asistencias = this.jugadores.map(j => ({
      jugador_id: j.id,
      presente: j.presente
    }));

    this.entrenamientoService.saveAsistencia(this.id, asistencias).subscribe({
      next: () => {
        this.success = 'Asistencia guardada correctamente';
        this.saving = false;
      },
      error: (err: any) => {
        this.error = 'Error al guardar asistencia';
        console.error(err);
        this.saving = false;
      }
    });
  }

  togglePresente(jugador: any) {
    jugador.presente = !jugador.presente;
  }

  getEstadisticas() {
    const total = this.jugadores.length;
    const presentes = this.jugadores.filter(j => j.presente).length;
    const ausentes = total - presentes;
    return { total, presentes, ausentes };
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

  back() {
    this.router.navigate(['/ver-entrenamientos-e']);
  }
}
