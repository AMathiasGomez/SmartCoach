import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from '../../../models/equipo.model';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../../services/partido/partido-service';
import { HttpClient } from '@angular/common/http';
import { EquipoService } from '../../../services/equipo/equipo-service';

@Component({
  selector: 'app-crear-partidos',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './crear-partidos.html',
  styleUrl: './crear-partidos.css',
})
export class CrearPartidos implements OnInit {

  partidoForm!: FormGroup;
  equipos: Equipo[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private partidoService: PartidoService,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private equipoService: EquipoService
  ) { }

  ngOnInit(): void {
    this.partidoForm = this.fb.group({
      nombre: ['', Validators.required],
      equipo_id: ['', Validators.required],
      rival: ['', Validators.required],
      fecha: ['', Validators.required],
      ubicacion: ['', Validators.required],
      tipo: ['', Validators.required]
    });

    this.cargarEquipos();
  }

  cargarEquipos() {
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
  }

  crearPartido() {
    if (this.partidoForm.invalid) {
      this.partidoForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const data = {
      nombre: this.partidoForm.value.nombre,
      equipo_id: this.partidoForm.value.equipo_id,
      rival: this.partidoForm.value.rival,
      fecha: this.partidoForm.value.fecha,
      ubicacion: this.partidoForm.value.ubicacion,
      tipo: this.partidoForm.value.tipo,
      estado: 'pendiente'
    };

    console.log('DATA ENVIADA:', data);

    this.partidoService.createPartido(data).subscribe({
      next: (res) => {
        alert('Partido creado correctamente');
        this.router.navigate(['/ver-partidos']);
      },
      error: (err) => {
        console.error(err);

        if (err.error?.message) {
          alert(err.error.message);
        } else {
          alert('Error al crear partido');
        }
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
