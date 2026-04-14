import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from '../../../models/equipo.model';
import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crear-entrenamiento',
  imports: [RouterLink, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './crear-entrenamiento.html',
  styleUrl: './crear-entrenamiento.css',
})
export class CrearEntrenamiento implements OnInit {
  formEntrenamiento!: FormGroup;
  equipos: any[] = [];

  constructor(
    private fb: FormBuilder,
    private entrenamientoService: EntrenamientoService,
    private equipoService: EquipoService,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.formEntrenamiento = this.fb.group({
      equipo_id: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      tipo: ['', Validators.required],
      duracion: [null, [Validators.required, Validators.min(10), Validators.max(180)]],
      estado: ['programado', Validators.required]
    });

    this.cargarEquipos();
    this.cd.detectChanges();
  }

  cargarEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: data => this.equipos = data,
      error: err => console.error(err)
    });
    this.cd.detectChanges();
  }

  crearEntrenamiento() {
    if (this.formEntrenamiento.invalid) {
      this.formEntrenamiento.markAllAsTouched();
      return;
    }

    const data = {
      equipo_id: this.formEntrenamiento.value.equipo_id,
      fecha: this.formEntrenamiento.value.fecha,
      hora: this.formEntrenamiento.value.hora,
      tipo: this.formEntrenamiento.value.tipo,
      duracion: this.formEntrenamiento.value.duracion,
      estado: this.formEntrenamiento.value.estado,
      descripcion: null
    };

    this.entrenamientoService.crearEntrenamiento(data)
      .subscribe({
        next: (res) => {
          alert('Partido creado correctamente');
          this.router.navigate(['/ver-entrenamientos']);
        },
        error: (err) => {
          console.error('Error: ', err);
        }
      });
  }

  minFecha = new Date().toISOString().split('T')[0];

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
