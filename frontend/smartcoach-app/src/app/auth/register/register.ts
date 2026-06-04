import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  rol = 'usuario';
  email = '';
  nombre = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  submitted = false;

  private rolesPermitidos = ['administrador', 'directivo', 'entrenador', 'usuario'];

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  register() {
    if (this.loading) return;

    this.errorMessage = '';
    this.submitted = true;

    const nombre = this.nombre.trim();
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!nombre || !email || !password) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (nombre.length < 3) {
      this.errorMessage = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'El correo no tiene un formato valido';
      return;
    }

    if (password.length < 6) {
      this.errorMessage = 'La contrasena debe tener al menos 6 caracteres';
      return;
    }

    if (!this.rolesPermitidos.includes(this.rol)) {
      this.errorMessage = 'Selecciona un rol valido';
      return;
    }

    this.loading = true;

    this.authService.register({
      rol: this.rol,
      nombre,
      email,
      password
    }).pipe(
      timeout(10000),
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        alert('Registro exitoso, ahora puedes iniciar sesion');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error en registro', err);

        if (err.name === 'TimeoutError') {
          this.errorMessage = 'El servidor no respondio. Intenta de nuevo.';
        } else if (err.status === 409) {
          this.errorMessage = 'El correo ya esta registrado';
        } else if (err.status === 400) {
          this.errorMessage = err.error?.error || 'Revisa los datos del formulario';
        } else if (err.status === 0) {
          this.errorMessage = 'No hay conexion con el servidor';
        } else {
          this.errorMessage = err.error?.error || 'Error en el servidor';
        }
      }
    });
  }
}
