import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';

@Component({
  selector: 'app-crear-equipo',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './crear-equipo.html',
  styleUrl: './crear-equipo.css',
})
export class CrearEquipo {

    form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private equipoService: EquipoService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['', Validators.required],
      ano_fundacion: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  guardar() {
  this.equipoService.crearEquipo(this.form.value).subscribe({
    next: () => {
      alert('Equipo creado correctamente');
      this.router.navigate(['/ver-equipos']);
    },
    error: () => {
      alert('Error al crear equipo');
    }
  });
}

}
