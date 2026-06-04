import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  submitted = false;

  constructor(
    private authService: AuthService,
    public router: Router,
  ) { }

  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (this.loading) return;

    this.errorMessage = '';
    this.submitted = true;

    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!email || !password) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'El correo no tiene un formato valido';
      return;
    }

    this.loading = true;

    this.authService.login({ email, password }).pipe(
      timeout(10000),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        if (!res?.token || !res?.user) {
          this.errorMessage = 'La respuesta del servidor no es valida';
          return;
        }

        localStorage.setItem('token', res.token);
        this.authService.setUser(res.user);

        const rol = this.authService.getRol();
        const rutas: Record<string, string> = {
          administrador: '/dashboard-admin',
          directivo: '/dashboard-directivo',
          entrenador: '/dashboard-entrenador',
          usuario: '/dashboard-usuario'
        };

        const ruta = rol ? rutas[rol] : null;

        if (ruta) {
          this.router.navigate([ruta]);
        } else {
          this.errorMessage = 'Tu usuario no tiene un rol valido para ingresar';
        }
      },
      error: (err) => {
        console.error('Error login', err);

        if (err.name === 'TimeoutError') {
          this.errorMessage = 'El servidor no respondio. Intenta de nuevo.';
        } else if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas';
        } else if (err.status === 400) {
          this.errorMessage = err.error?.error || 'Revisa el correo y la contrasena';
        } else if (err.status === 0) {
          this.errorMessage = 'No hay conexion con el servidor';
        } else {
          this.errorMessage = err.error?.error || 'Error en el servidor';
        }
      }
    });
  }
}
