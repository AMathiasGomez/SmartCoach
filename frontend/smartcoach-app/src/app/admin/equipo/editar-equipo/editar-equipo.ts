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

  form!: FormGroup;
  id!: number;
  cargando = true;

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

    console.log('ID recibido:', this.id);

    if (!this.id) {
      console.error('ID inválido');
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

        console.log('Respuesta backend:', res);

        if (!res) {
          console.error('Equipo no encontrado');
          this.router.navigate(['/ver-equipos']);
          return;
        }

        this.form.patchValue({
          nombre: res.nombre,
          categoria: res.categoria,
          ano_fundacion: res.ano_fundacion,
          descripcion: res.descripcion
        });

        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        alert('Error al cargar equipo');
        this.router.navigate(['/ver-equipos']);
      }
    });
  }

  actualizarEquipo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.equipoService.actualizarEquipo(this.id, this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/ver-equipos']);
      },
      error: (err: any) => {
        console.error('Error al actualizar equipo', err);
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}