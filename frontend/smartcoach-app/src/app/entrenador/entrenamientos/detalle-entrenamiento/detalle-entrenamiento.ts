import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';
import { AuthService } from '../../../services/auth/auth-service';
import { environment } from '../../../../environments/environment';

interface Comentario {
  id: number;
  contenido: string;
  fecha: string;
  usuarios_id: number;
  created_at: string;
  nombreUsuario?: string;
}

@Component({
  selector: 'app-detalle-entrenamiento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgFor, DatePipe, TitleCasePipe, RouterLink],
  templateUrl: './detalle-entrenamiento.html',
  styleUrl: './detalle-entrenamiento.css'
})
export class DetalleEntrenamiento implements OnInit {

  // ── Entrenamiento y asistencia ──────────────────────────────────────────────
  entrenamiento: any = null;
  jugadores: any[] = [];
  loading = false;
  saving = false;
  statusSaving = false;
  error = '';
  success = '';
  id!: number;

  // ── Comentarios ─────────────────────────────────────────────────────────────
  comentarios: Comentario[] = [];
  nuevoComentario = '';
  enviandoComentario = false;
  cargandoComentarios = false;
  usuarioActual: any = null;
  private baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entrenamientoService: EntrenamientoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.usuarioActual = this.authService.getUser();
    this.loadEntrenamiento();
    this.cargarComentarios();
  }

  // ── Entrenamiento ───────────────────────────────────────────────────────────

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

    const asistencias = this.buildAsistenciasPayload();

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

  iniciarEntrenamiento() {
    this.updateEstado('en_curso', 'Entrenamiento iniciado correctamente');
  }

  finalizarEntrenamiento() {
    this.statusSaving = true;
    this.success = '';
    this.error = '';

    this.entrenamientoService.saveAsistencia(this.id, this.buildAsistenciasPayload()).subscribe({
      next: () => {
        this.entrenamientoService.updateEstado(this.id, 'completado').subscribe({
          next: () => {
            this.entrenamiento.estado = 'completado';
            this.success = 'Entrenamiento finalizado correctamente';
            this.statusSaving = false;
            this.cd.detectChanges();
          },
          error: (err: any) => {
            this.error = err?.error?.message || 'Error al finalizar entrenamiento';
            console.error(err);
            this.statusSaving = false;
          }
        });
      },
      error: (err: any) => {
        this.error = 'Error al guardar asistencia antes de finalizar';
        console.error(err);
        this.statusSaving = false;
      }
    });
  }

  updateEstado(estado: string, message: string) {
    this.statusSaving = true;
    this.success = '';
    this.error = '';

    this.entrenamientoService.updateEstado(this.id, estado).subscribe({
      next: () => {
        this.entrenamiento.estado = estado;
        this.success = message;
        this.statusSaving = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Error al actualizar estado del entrenamiento';
        console.error(err);
        this.statusSaving = false;
      }
    });
  }

  buildAsistenciasPayload() {
    return this.jugadores.map(j => ({
      jugador_id: j.id,
      presente: j.presente
    }));
  }

  getEstado(): string {
    return (this.entrenamiento?.estado || 'programado').toLowerCase();
  }

  getEstadoLabel(): string {
    const labels: Record<string, string> = {
      programado: 'Programado',
      en_curso: 'En curso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return labels[this.getEstado()] || this.entrenamiento?.estado || 'Programado';
  }

  getEstadoClass(): string {
    return `estado-${this.getEstado().replace('_', '-')}`;
  }

  entrenamientoIniciado(): boolean {
    return ['en_curso', 'completado'].includes(this.getEstado());
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

  // ── Comentarios ─────────────────────────────────────────────────────────────

  cargarComentarios() {
    this.cargandoComentarios = true;
    this.entrenamientoService.getComentarios(this.id).subscribe({
      next: (data) => {
        this.comentarios = data;
        this.cargandoComentarios = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar comentarios:', err);
        this.cargandoComentarios = false;
      }
    });
  }

  agregarComentario() {
    if (!this.nuevoComentario.trim() || !this.usuarioActual) return;

    this.enviandoComentario = true;

    const payload = {
      contenido: this.nuevoComentario.trim(),
      fecha: new Date().toISOString().split('T')[0],
      usuarios_id: this.usuarioActual.id,
      entrenamiento_id: this.id
    };

    this.entrenamientoService.crearComentario(payload).subscribe({
      next: (creado) => {
        creado.nombreUsuario = this.usuarioActual.nombre;
        this.comentarios.unshift(creado);
        this.nuevoComentario = '';
        this.enviandoComentario = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear comentario:', err);
        this.enviandoComentario = false;
      }
    });
  }

  eliminarComentario(comentario: Comentario) {
    if (!confirm('¿Eliminar este comentario?')) return;

    this.entrenamientoService.eliminarComentario(comentario.id).subscribe({
      next: () => {
        this.comentarios = this.comentarios.filter(c => c.id !== comentario.id);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al eliminar comentario:', err)
    });
  }

  puedeEliminarComentario(comentario: Comentario): boolean {
    if (!this.usuarioActual) return false;
    return (
      comentario.usuarios_id === this.usuarioActual.id ||
      this.usuarioActual.rol === 'administrador'
    );
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  getFotoUrl(fotoUrl?: string): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    const path = fotoUrl.startsWith('/uploads') ? fotoUrl : `/uploads/jugadores/${fotoUrl}`;
    return `${this.baseUrl}${path}`;
  }

  onJugadorFotoError(jugador: any) {
    jugador.fotoError = true;
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

  back() {
    this.router.navigate(['/ver-entrenamientos-e']);
  }
}
