import { HttpClient } from '@angular/common/http';
import { Component, NgModule } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule,],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  rol = '';
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    public router: Router,
  ) {}

login() {

  const data = {
    rol: this.rol,
    email: this.email,
    password: this.password
  };

  console.log('Enviando login:', data);

  this.authService.login(data).subscribe({
    next: (res: any) => {
      console.log('Login exitoso', res);

      localStorage.setItem('token', res.token);

      const rol = this.authService.getRol();

      console.log('ROL DESDE TOKEN:', rol);

      const rutas: any = {
        Administrador: '/dashboard-admin',
        Directivo: '/dashboard-directivo',
        Entrenador: '/dashboard-entrenador'
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

      if (err.status === 401) {
        alert('Credenciales incorrectas');
      } else if (err.status === 0) {
        alert('No hay conexión con el servidor');
      } else {
        alert('Error en el servidor');
      }
    }
  });
}
}
