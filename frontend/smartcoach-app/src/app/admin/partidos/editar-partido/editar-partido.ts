import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PartidoService } from '../../../services/partido/partido-service';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { Equipo } from '../../../models/equipo.model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-editar-partido',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './editar-partido.html',
  styleUrl: './editar-partido.css',
})
export class EditarPartido {

  equipos: Equipo[] = [];

  partidoForm!: FormGroup;
  partidoId!: number;
  partido: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private equipoService: EquipoService,
    private partidoService: PartidoService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.partidoId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.cargarPartido();
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



this.http.get('https://smartcoach-production.up.railway.app/api/equipos')
      .subscribe((data: any) => {
        this.equipos = data;
      })
  }

  initForm() {
    this.partidoForm = this.fb.group({
      nombre: [''],
      equipo_id: [{ value: '', disabled: true }], // 🔥 aquí
      rival: [''],
      fecha: [''],
      ubicacion: [''],
      tipo: ['']
    });
  }

  cargarPartido() {
    this.partidoService.getPartidoById(this.partidoId).subscribe({
      next: (data: any) => {
        this.partido = data;

        this.partidoForm.patchValue({
          nombre: data.nombre,
          equipo_id: data.equipo_id,
          rival: data.rival,
          fecha: data.fecha.split('T')[0],
          ubicacion: data.ubicacion,
          tipo: data.tipo
        });
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  actualizarPartido() {

    if (this.partidoForm.invalid) return;

    if (this.partido.estado === 'finalizado') {
      alert('No puedes editar un partido finalizado');
      return;
    }

    this.partidoService.updatePartido(this.partidoId, this.partidoForm.value)
      .subscribe({
        next: () => {
          alert("El partido ha sido actualizado exitosamente")
          console.log('Partido actualizado');
          this.router.navigate(['/ver-partidos']);
        },
        error: (err) => console.error(err)
      });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
