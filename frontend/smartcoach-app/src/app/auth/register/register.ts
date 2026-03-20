import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',

  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  rol = '';
  email = '';
  nombre = '';
  password = ''

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  register() {

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
