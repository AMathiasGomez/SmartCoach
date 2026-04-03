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
  password = ''

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  register() {

    if (!this.email || !this.password) {
      alert('Todos los campos son obligatorios');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      alert('El correo no tiene un formato válido');
      return;
    }

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
        
        alert('Registro exitoso, ahora puedes iniciar sesión');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error en registro', err);

        if(err.status === 400) {
          alert('El usuario ya existe');
        } else if (err.status === 0) {
          alert('No hay conexión con el servidor.');
        } else {
          alert('Error en el servidor.');
        }
        
      }
    });
  }
}
