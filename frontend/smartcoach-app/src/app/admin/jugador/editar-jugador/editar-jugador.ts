import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';
import { EquipoService } from '../../../services/equipo/equipo-service';

@Component({
  selector: 'app-editar-jugador',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './editar-jugador.html',
  styleUrls: ['./editar-jugador.css']
})
export class EditarJugador implements OnInit {

  id!: number;

  jugador = {
    nombre: '',
    fecha_nacimiento: '',
    posicion: '',
    numero: 0,
    equipo_id: 0,
    foto_url: ''
  };

  equipos: any[] = [];

  cargando = true;

  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;
  fotoError: string = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

    if (!this.id) {
      console.error('ID no válido');
      this.router.navigate(['/ver-jugadores']);
      return;
    }

    this.obtenerJugador();
    this.obtenerEquipos();
  }

  obtenerJugador() {
    this.jugadorService.getJugador(this.id).subscribe({
      next: (res: any) => {

        console.log('✅ jugador:', res);

        this.jugador = res;

        this.cd.detectChanges();

        this.cargando = false;
      },
      error: (err: any) => {
        console.error('❌ error:', err);
        this.router.navigate(['/ver-jugadores']);
      }
    });
  }

  obtenerEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: (res: any) => {
        this.equipos = res;
      },
      error: (err: any) => {
        console.error('Error cargando equipos', err);
      }
    });
  }

  actualizarJugador() {
    if (!this.jugador.nombre || !this.jugador.posicion || !this.jugador.numero || !this.jugador.equipo_id) {
      console.error('Campos obligatorios');
      return;
    }

    if (this.fotoArchivo) {
      const formData = new FormData();
      formData.append('nombre', this.jugador.nombre);
      formData.append('fecha_nacimiento', this.jugador.fecha_nacimiento);
      formData.append('posicion', this.jugador.posicion);
      formData.append('numero', String(this.jugador.numero));
      formData.append('equipo_id', String(this.jugador.equipo_id));
      formData.append('foto', this.fotoArchivo, this.fotoArchivo.name);

      this.jugadorService.actualizarJugador(this.id, formData).subscribe({
        next: () => {
          alert('Jugador actualizado correctamente');
          this.router.navigate(['/ver-jugadores']);
        },
        error: (err: any) => console.error('Error al actualizar jugador', err)
      });

    } else {
      this.jugadorService.actualizarJugadorJson(this.id, {
        nombre: this.jugador.nombre,
        fecha_nacimiento: this.jugador.fecha_nacimiento,
        posicion: this.jugador.posicion,
        numero: this.jugador.numero,
        equipo_id: this.jugador.equipo_id
      }).subscribe({
        next: () => {
          alert('Jugador actualizado correctamente');
          this.router.navigate(['/ver-jugadores']);
        },
        error: (err: any) => {
          alert(err.error.message);
          console.error('Error al actualizar jugador', err)
        } 
      });
    }
  }

  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      this.fotoError = 'Solo se permiten imágenes JPG, PNG o WEBP.';
      this.fotoArchivo = null;
      this.fotoPreview = null;
      return;
    }

    if (archivo.size > maxSize) {
      this.fotoError = 'La imagen no debe superar los 5MB.';
      this.fotoArchivo = null;
      this.fotoPreview = null;
      return;
    }

    this.fotoError = '';
    this.fotoArchivo = archivo;

    const reader = new FileReader();
    reader.onload = () => { this.fotoPreview = reader.result as string; };
    reader.readAsDataURL(archivo);
    this.cd.detectChanges();
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}