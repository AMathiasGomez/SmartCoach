import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    this.errorMessage = '';

    if (!this.nombre || !this.email || !this.password) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'El correo no tiene un formato válido';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;

    const data = {
      rol: this.rol,
      nombre: this.nombre,
      email: this.email,
      password: this.password
    };

    console.log('Enviando:', data);

    this.authService.register(data).subscribe({
      next: (res: any) => {
        console.log('Registro exitoso', res);
        this.loading = false;
        
        alert('Registro exitoso, ahora puedes iniciar sesión');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error en registro', err);
        this.loading = false;

        if(err.status === 400) {
          this.errorMessage = 'El usuario ya existe';
        } else if (err.status === 0) {
          this.errorMessage = 'No hay conexión con el servidor.';
        } else {
          this.errorMessage = 'Error en el servidor.';
        }
        
      }
    });
  }
}
