import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  form = {
    rol: '',
    correo: '',
    password: ''
  };
  router: any;

  constructor(private http: HttpClient) {}

  login(){
    this.http.post('http://localhost:3006/api/login', this.form)
      .subscribe({
        next: (response: any) => {
        
          localStorage.setItem('token', response.token);

          const payload = JSON.parse(atob(response.token.split('.')[1]));
          localStorage.setItem('rol', payload.rol);

          if(payload.rol === 'administrador'){
            this.router.navigate(['/administrador']);
          } else if (payload.rol === 'entrenador') {
            this.router.navigate(['/entrenador']);
          } else {
            this.router.navigate(['/directivo']);
          }

        },
        error: (error) => {
          console.error('Error login', error);
        }
      });
  }
}
