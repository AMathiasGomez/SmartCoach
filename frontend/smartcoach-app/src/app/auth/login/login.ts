import { HttpClient } from '@angular/common/http';
import { Component, NgModule } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

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
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'El correo no tiene un formato válido';
      return;
    }

    this.loading = true;

    const data = {
      email: this.email,
      password: this.password
    };

    console.log('Enviando login:', data);

    this.authService.login(data).subscribe({
      next: (res: any) => {
        console.log('Login exitoso', res);
        this.loading = false;

        localStorage.setItem('token', res.token);

        const rol = this.authService.getRol();

        console.log('ROL DESDE TOKEN:', rol);

        const rutas: any = {
          administrador: '/dashboard-admin',
          directivo: '/dashboard-directivo',
          entrenador: '/dashboard-entrenador',
          usuario: '/dashboard-usuario'
        }

        const ruta = rutas[rol!];

        console.log('RUTA:', ruta);

        if (ruta) {
          this.router.navigate([ruta]);
        } else {
          console.log('Rol no válido:', rol);
        }
      },
      error: (err) => {
        console.error('Error login', err);
        this.loading = false;

        if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas';
        } else if (err.status === 0) {
          this.errorMessage = 'No hay conexión con el servidor';
        } else {
          this.errorMessage = 'Error en el servidor';
        }
      }
    });
  }
}
