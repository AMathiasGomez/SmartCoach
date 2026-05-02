import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-editar-equipo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './editar-equipo.html',
  styleUrls: ['./editar-equipo.css']
})
export class EditarEquipo implements OnInit {

  private apiBaseUrl = 'https://smartcoach-production.up.railway.app';
  
  form!: FormGroup;
  id!: number;
  cargando = true;

  // Photo handling
  fotoArchivo: File | null = null;
  fotoPreview: string | null = null;
  fotoError: string = '';
  fotoActual: string = '';
  equipoNombre: string = '';

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private equipoService: EquipoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.params['id']);

    if (!this.id) {
      this.router.navigate(['/ver-equipos']);
      return;
    }

    this.initForm();
    this.obtenerEquipo();
  }

  initForm() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['', Validators.required],
      ano_fundacion: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  obtenerEquipo() {
    this.equipoService.getEquipo(this.id).subscribe({
      next: (res: any) => {
        if (!res) {
          this.router.navigate(['/ver-equipos']);
          return;
        }

        this.form.patchValue({
          nombre: res.nombre,
          categoria: res.categoria,
          ano_fundacion: res.ano_fundacion,
          descripcion: res.descripcion
        });

        // Store current photo and team name
        this.fotoActual = res.foto || '';
        this.equipoNombre = res.nombre || '';

        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        alert('Error al cargar equipo');
        this.router.navigate(['/ver-equipos']);
      }
    });
  }

  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      this.fotoError = 'Solo se permiten imágenes JPG, PNG o WEBP.';
      this.fotoArchivo = null;
      this.fotoPreview = null;
      return;
    }

    if (archivo.size > maxSize) {
      this.fotoError = 'La imagen no debe superar los 5MB.';
      this.fotoArchivo = null;
      this.fotoPreview = null;
      return;
    }

    this.fotoError = '';
    this.fotoArchivo = archivo;

    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview = reader.result as string;
    };
    reader.readAsDataURL(archivo);
  }

eliminarFoto(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.fotoArchivo = null;
    this.fotoPreview = null;
    this.fotoError = '';
    const input = document.getElementById('foto-input-edit') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  getFotoUrl(fotoUrl: string | undefined | null): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    return this.apiBaseUrl + fotoUrl;
  }

  actualizarEquipo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Check if there's a new photo to upload
    if (this.fotoArchivo) {
      const formData = new FormData();
      const valores = this.form.value;

      formData.append('nombre', valores.nombre);
      formData.append('categoria', valores.categoria);
      formData.append('ano_fundacion', valores.ano_fundacion);
      formData.append('descripcion', valores.descripcion);
      formData.append('foto', this.fotoArchivo, this.fotoArchivo.name);

      this.equipoService.actualizarEquipo(this.id, formData as any).subscribe({
        next: () => {
          alert('Equipo actualizado correctamente');
          this.router.navigate(['/ver-equipos']);
        },
        error: (err: any) => {
          console.error('Error al actualizar equipo', err);
          alert(err.error?.message || 'Error al actualizar equipo');
        }
      });
    } else {
      this.equipoService.actualizarEquipo(this.id, this.form.value).subscribe({
        next: () => {
          alert('Equipo actualizado correctamente');
          this.router.navigate(['/ver-equipos']);
        },
        error: (err: any) => {
          console.error('Error al actualizar equipo', err);
          alert(err.error?.message || 'Error al actualizar equipo');
        }
      });
    }
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
