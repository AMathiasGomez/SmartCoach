import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crear-equipo',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './crear-equipo.html',
  styleUrl: './crear-equipo.css',
})
export class CrearEquipo {
  form: FormGroup;
  errorMessage: string = '';

  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;
  fotoError: string = '';

  constructor(
    private fb: FormBuilder,
    private equipoService: EquipoService,
    public router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      categoria: ['', Validators.required],
      ano_fundacion: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{4}$/),
        Validators.min(1900),
        Validators.max(new Date().getFullYear())
      ]],
      descripcion: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200)
      ]]
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

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const formData = new FormData();
    const valores = this.form.value;

    formData.append('nombre', valores.nombre);
    formData.append('categoria', valores.categoria);
    formData.append('ano_fundacion', valores.ano_fundacion);
    formData.append('descripcion', valores.descripcion);

    if (this.fotoArchivo) {
      formData.append('foto', this.fotoArchivo, this.fotoArchivo.name);
    }

    this.equipoService.crearEquipo(formData).subscribe({
      next: (res) => {
        alert('Equipo creado correctamente');
        this.router.navigate(['/ver-equipos']);
      },
      error: (err) => {
        console.error('ERROR:', err);
        this.errorMessage = err.error?.message || 'Error inesperado en el servidor';
        alert(this.errorMessage);
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}