import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  form= {
    rol: '',
    nombre: '',
    email: '',
    password: ''
  };

  constructor(private http: HttpClient) {}
    register(){
      this.http.post('http://localhost:3000/api/register', this.form)
      .subscribe({
        next: (response) => {
          console.log('Registro exitoso', response);
        },
        error: (error) => {
          console.error('Error en el registro', error);
        }
      });
    }
  }
