import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { Equipo } from '../../../models/equipo.model';

@Component({
  selector: 'app-crear-jugador',
  imports: [ ReactiveFormsModule, RouterLink, CommonModule ],
  templateUrl: './crear-jugador.html',
  styleUrl: './crear-jugador.css',
})

export class CrearJugador implements OnInit {

  equipos: Equipo[] = [];

  formJugador!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private jugadorService: JugadorService,
    public router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private equipoService: EquipoService
  ) {
  }


  ngOnInit(): void {
    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        this.equipos = data;
        console.log('Equipos:', data);
      },
      error: (err) => {
        console.error('Error al cargar equipos', err);
        alert('Error al cargar equipos');
      }
    });
        


    this.http.get('http://localhost:3006/api/equipos')
    .subscribe((data: any) => {
      this.equipos = data;
    })


    this.formJugador = this.fb.group({
      nombre: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      posicion: ['', Validators.required],
      numero: ['', [Validators.required, Validators.min(1)]],
      equipo_id: [0, Validators.required]
    });
  }

  crearJugador() {
    if (this.formJugador.invalid) {
      this.formJugador.markAllAsTouched();
      return;
    }

    this.http.post('http://localhost:3006/api/jugadores', this.formJugador.value)
      .subscribe({
        next: (res) => {
          alert('Jugador creado correctamente');
          this.router.navigate(['/ver-jugadores']);
        },
        error: (err) => {
          console.error('Error', err);
        }
      });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
