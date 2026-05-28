import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { EntrenamientoService } from '../../../services/entrenamiento/entrenamiento-service';

@Component({
  selector: 'app-editar-entrenamiento',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './editar-entrenamiento.html',
  styleUrl: './editar-entrenamiento.css',
})
export class EditarEntrenamiento implements OnInit {
  formEntrenamiento!: FormGroup;
  entrenamientoId!: number;
  entrenamiento: any = null;
  equipos: any[] = [];
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private entrenamientoService: EntrenamientoService,
    private equipoService: EquipoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.entrenamientoId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.cargarEquipos();
    this.cargarEntrenamiento();
  }

  initForm(): void {
    this.formEntrenamiento = this.fb.group({
      equipo_id: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      tipo: ['', Validators.required],
      duracion: [null, [Validators.required, Validators.min(10), Validators.max(180)]],
      estado: ['programado', Validators.required],
      descripcion: [''],
    });
  }

  cargarEquipos(): void {
    this.equipoService.getEquipos().subscribe({
      next: (data) => {
        this.equipos = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar equipos', err),
    });
  }

  cargarEntrenamiento(): void {
    this.loading = true;

    this.entrenamientoService.getEntrenamiento(this.entrenamientoId).subscribe({
      next: (data: any) => {
        this.entrenamiento = data;

        this.formEntrenamiento.patchValue({
          equipo_id: data.equipo_id,
          fecha: this.formatearFecha(data.fecha),
          hora: data.hora,
          tipo: this.normalizarTipoEntrenamiento(data.tipo),
          duracion: data.duracion,
          estado: data.estado || 'programado',
          descripcion: data.descripcion || '',
        });

        if (data.estado === 'completado') {
          this.formEntrenamiento.disable();
        }

        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar entrenamiento', err);
        alert('Error al cargar entrenamiento');
        this.router.navigate(['/ver-entrenamientos']);
      },
    });
  }

  actualizarEntrenamiento(): void {
    if (this.formEntrenamiento.invalid || this.saving) {
      this.formEntrenamiento.markAllAsTouched();
      return;
    }

    if (this.entrenamiento?.estado === 'completado') {
      alert('No puedes editar un entrenamiento completado');
      return;
    }

    this.saving = true;

    this.entrenamientoService.updateEntrenamiento(
      this.entrenamientoId,
      this.formEntrenamiento.getRawValue()
    ).subscribe({
      next: () => {
        alert('Entrenamiento actualizado correctamente');
        this.router.navigate(['/ver-entrenamientos']);
      },
      error: (err) => {
        console.error('Error al actualizar entrenamiento', err);
        alert(err.error?.message || 'Error al actualizar entrenamiento');
        this.saving = false;
        this.cd.detectChanges();
      },
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formEntrenamiento.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  formatearFecha(fecha: string): string {
    return fecha ? fecha.split('T')[0] : '';
  }

  normalizarTipoEntrenamiento(tipo: string | null | undefined): string {
    const valor = (tipo || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const tipos: Record<string, string> = {
      tactico: 'tactico',
      fisico: 'fisico',
      tecnico: 'tecnico',
    };

    return tipos[valor] || '';
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
