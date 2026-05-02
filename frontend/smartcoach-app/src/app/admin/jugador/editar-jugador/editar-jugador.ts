import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { Equipo } from '../../../models/equipo.model';

@Component({
  selector: 'app-editar-jugador',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './editar-jugador.html',
  styleUrls: ['./editar-jugador.css']
})
export class EditarJugador implements OnInit {

  private apiBaseUrl = 'https://smartcoach-production.up.railway.app';
  
  formJugador!: FormGroup;
  id!: number;
  cargando = true;

  equipos: Equipo[] = [];

  // Photo handling
  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;
  fotoError: string = '';
  fotoActual: string = '';
  jugadorNombre: string = '';

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.params['id']);

    if (!this.id) {
      this.router.navigate(['/ver-jugadores']);
      return;
    }

    this.initForm();
    this.obtenerEquipos();
    this.obtenerJugador();
  }

  initForm() {
    this.formJugador = this.fb.group({
      nombre: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      posicion: ['', Validators.required],
      numero: ['', [Validators.required, Validators.min(1)]],
      equipo_id: [0, Validators.required]
    });
  }

  obtenerEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        this.equipos = data;
      },
      error: (err) => {
        console.error('Error al cargar equipos', err);
      }
    });
  }

  obtenerJugador() {
    this.jugadorService.getJugador(this.id).subscribe({
      next: (res: any) => {
        if (!res) {
          this.router.navigate(['/ver-jugadores']);
          return;
        }

        this.formJugador.patchValue({
          nombre: res.nombre,
          fecha_nacimiento: res.fecha_nacimiento,
          posicion: res.posicion,
          numero: res.numero,
          equipo_id: res.equipo_id
        });

        // Store current photo and player name
        this.fotoActual = res.foto_url || '';
        this.jugadorNombre = res.nombre || '';

        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        alert('Error al cargar jugador');
        this.router.navigate(['/ver-jugadores']);
      }
    });
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
    reader.onload = () => {
      this.fotoPreview = reader.result as string;
    };
    reader.readAsDataURL(archivo);
  }

  eliminarFoto(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.fotoArchivo = null;
    this.fotoPreview = null;
    this.fotoError = '';
    const input = document.getElementById('foto-input-edit') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  hasExistingImage(): boolean {
    return !!this.fotoActual && this.fotoActual.trim() !== '';
  }

  getFotoUrl(fotoUrl: string | undefined | null): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    return this.apiBaseUrl + fotoUrl;
  }

  actualizarJugador() {
    if (this.formJugador.invalid) {
      this.formJugador.markAllAsTouched();
      return;
    }

    const valores = this.formJugador.value;

    // Check if there's a new photo to upload
    if (this.fotoArchivo) {
      const formData = new FormData();
      formData.append('nombre', valores.nombre);
      formData.append('fecha_nacimiento', valores.fecha_nacimiento);
      formData.append('posicion', valores.posicion);
      formData.append('numero', valores.numero);
      formData.append('equipo_id', valores.equipo_id);
      formData.append('foto', this.fotoArchivo, this.fotoArchivo.name);

      this.jugadorService.actualizarJugador(this.id, formData).subscribe({
        next: () => {
          alert('Jugador actualizado correctamente');
          this.router.navigate(['/ver-jugadores']);
        },
        error: (err: any) => {
          console.error('Error al actualizar jugador', err);
          alert(err.error?.message || 'Error al actualizar jugador');
        }
      });
    } else {
      this.jugadorService.actualizarJugadorJson(this.id, {
        nombre: valores.nombre,
        fecha_nacimiento: valores.fecha_nacimiento,
        posicion: valores.posicion,
        numero: valores.numero,
        equipo_id: valores.equipo_id
      }).subscribe({
        next: () => {
          alert('Jugador actualizado correctamente');
          this.router.navigate(['/ver-jugadores']);
        },
        error: (err: any) => {
          console.error('Error al actualizar jugador', err);
          alert(err.error?.message || 'Error al actualizar jugador');
        }
      });
    }
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
