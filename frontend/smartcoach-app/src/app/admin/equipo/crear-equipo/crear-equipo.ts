import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  errorMessage: string = ''

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

  guardar() {
    console.log('CLICK GUARDAR');
    console.log('FORM VALUE:', this.form.value);

    if (this.form.invalid) {
      console.log('FORM INVALID');
      this.form.markAllAsTouched();
      return;
    }

    this.equipoService.crearEquipo(this.form.value).subscribe({
      next: (res) => {
        console.log("RESPUESTA:", res);
        alert('Equipo creado correctamente');
        this.router.navigate(['/ver-equipos']);
      },
      error: (err) => {
        console.error('ERROR:', err);
        this.errorMessage = err.error?.message || 'Error al crear equipo';
        alert(err.error.message);
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}