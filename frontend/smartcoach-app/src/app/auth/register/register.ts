import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
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
    console.log('Datos', this.rol, this.nombre, this.email, this.password);

    if(!this.email || !this.password || !this.rol) {
      console.error('Faltan campos');
      return;
    }

    const data = {
      rol: this.rol,
      nombre: this.nombre,
      email: this.email,
      password: this.password
    };

    this.authService.register(data).subscribe({
      next: (res: any) => {
        console.log('Registro exitoso', res),

        this.router.navigate(['/login'])
      },
      error: (err) => {
        console.error('Error de registro', err);
      }
    })

  }
}
