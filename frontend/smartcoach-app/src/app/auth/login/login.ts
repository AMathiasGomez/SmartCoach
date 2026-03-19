import { HttpClient } from '@angular/common/http';
import { Component, NgModule } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule],
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
    console.log('Datos enviados:', this.rol, this.email, this.password);

    if(!this.email || !this.password || !this.rol) {
      console.log('Completa todos los campos');
      return;
    }

    const data = {
      rol: this.rol,
      email: this.email,
      password: this.password,
    };

    this.authService.login(data).subscribe({
      next: (res: any)=> {
        console.log('Login correcto', res);

        localStorage.setItem('user', JSON.stringify(res.user))

        this.router.navigate(['/dashboard'])
      },
      error: (err: any) => {
        console.log('Error login', err);

        if(err.status === 0) {
          console.log('El backend no está corriendo o el puerto es incorrecto');
        } else {
          console.log('Credenciales incorrectas o error del servidor');

        }
      }
    })

  }
}
