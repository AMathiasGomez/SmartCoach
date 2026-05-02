import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { CommonModule } from '@angular/common';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { Equipo } from '../../../models/equipo.model';

@Component({
  selector: 'app-crear-jugador',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './crear-jugador.html',
  styleUrls: ['./crear-jugador.css']
})
export class CrearJugador implements OnInit {

  equipos: Equipo[] = [];

  formJugador!: FormGroup;
  errorMessage: string = '';

  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;
  fotoError: string = '';
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private jugadorService: JugadorService,
    public router: Router,
    private authService: AuthService,
    private equipoService: EquipoService
  ) { }

  ngOnInit(): void {
    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        this.equipos = data;
      },
      error: (err) => {
        console.error('Error al cargar equipos', err);
      }
    });

    this.formJugador = this.fb.group({
      nombre: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      posicion: ['', Validators.required],
      numero: ['', [Validators.required, Validators.min(1)]],
      equipo_id: [0, Validators.required]
    });
  }

  crearJugador() {
    if (this.formJugador.invalid) {
      this.formJugador.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const formData = new FormData();
    const valores = this.formJugador.value;

    formData.append('nombre', valores.nombre);
    formData.append('fecha_nacimiento', valores.fecha_nacimiento);
    formData.append('posicion', valores.posicion);
    formData.append('numero', valores.numero);
    formData.append('equipo_id', valores.equipo_id);

    if (this.fotoArchivo) {
      formData.append('foto', this.fotoArchivo, this.fotoArchivo.name);
    }

    this.jugadorService.crearJugador(formData).subscribe({
      next: () => {
        alert('Jugador creado correctamente');
        this.router.navigate(['/ver-jugadores']);
      },
      error: (err) => {
        this.guardando = false;
        console.error(err);
        this.errorMessage = err.error?.message || 'Error al crear jugador';
        alert(err.error?.message || 'Error al crear jugador');
      }
    });
  }

  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

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
    const input = document.getElementById('foto-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
