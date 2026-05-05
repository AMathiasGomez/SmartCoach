import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from '../../../models/equipo.model';
import { CommonModule } from '@angular/common';
import { PartidoService } from '../../../services/partido/partido-service';
import { HttpClient } from '@angular/common/http';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { environment } from '../../../../environments/environment.development';

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

  jugadores: any[] = [];
  convocados: number[] = [];

  constructor(
    private fb: FormBuilder,
    private partidoService: PartidoService,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private equipoService: EquipoService,
    private cd: ChangeDetectorRef
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



    this.http.get(`${environment.apiUrl}/equipos`)
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
      estado: 'pendiente',
      convocados: this.convocados
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

  onEquipoChange() {
    const equipoId = this.partidoForm.get('equipo_id')?.value;

    if (!equipoId) return;

    this.partidoService.getJugadoresByEquipo(equipoId)
      .subscribe({
        next: (data) => {
          console.log('JUGADORES LISTA', data);

          this.jugadores = data;
          this.convocados = [];
          this.cd.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  toggleConvocado(jugadorId: number, event: any) {
    if (event.target.checked) {
      this.convocados.push(jugadorId);
    } else {
      this.convocados = this.convocados.filter(id => id !== jugadorId);
    }
  }

  minFecha = new Date().toISOString().split('T')[0];

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
