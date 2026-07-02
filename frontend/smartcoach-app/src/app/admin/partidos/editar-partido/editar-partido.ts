import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
export class EditarPartido implements OnInit {

  equipos: Equipo[] = [];
  jugadores: any[] = [];
  convocados: number[] = [];

  partidoForm!: FormGroup;
  partidoId!: number;
  partido: any;
  sidebarOpen = false;

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
    this.cargarEquipos();
    this.cargarPartido();
  }

  initForm() {
    this.partidoForm = this.fb.group({
      nombre: [''],
      equipo_id: [''],
      rival: [''],
      fecha: [''],
      ubicacion: [''],
      tipo: ['']
    });
  }

  cargarEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: (data) => { this.equipos = data; },
      error: (err) => console.error('Error al cargar equipos', err)
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

        // Cargar jugadores del equipo y marcar convocados existentes
        if (data.equipo_id) {
          this.cargarJugadores(data.equipo_id, data.convocados);
        }

        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarJugadores(equipoId: number, convocadosRaw: any) {
    this.partidoService.getJugadoresByEquipo(equipoId).subscribe({
      next: (jugadores) => {
        this.jugadores = jugadores;

        // Soporta tanto [1, 2, 3] como [{ id: 1 }, { id: 2 }]
        if (Array.isArray(convocadosRaw)) {
          this.convocados = convocadosRaw.map((c: any) =>
            typeof c === 'object' ? c.id : c
          );
        } else {
          this.convocados = [];
        }

        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar jugadores', err)
    });
  }

  onEquipoChange() {
    const equipoId = this.partidoForm.get('equipo_id')?.value;
    console.log('Equipo seleccionado:', equipoId, typeof equipoId);
    if (!equipoId) return;

    this.jugadores = [];
    this.convocados = [];

    this.partidoService.getJugadoresByEquipo(equipoId).subscribe({
      next: (data) => {
        this.jugadores = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar jugadores', err)
    });
  }

  isConvocado(jugadorId: number): boolean {
    return this.convocados.includes(jugadorId);
  }

  toggleConvocado(jugadorId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.convocados.includes(jugadorId)) {
        this.convocados.push(jugadorId);
      }
    } else {
      this.convocados = this.convocados.filter(id => id !== jugadorId);
    }
  }

  actualizarPartido() {
    if (this.partidoForm.invalid) return;

    if (this.partido.estado === 'finalizado') {
      alert('No puedes editar un partido finalizado');
      return;
    }

    const data = {
      ...this.partidoForm.getRawValue(), // getRawValue incluye campos disabled
      convocados: this.convocados
    };

    this.partidoService.updatePartido(this.partidoId, data).subscribe({
      next: () => {
        alert('El partido ha sido actualizado exitosamente');
        this.router.navigate(['/ver-partidos']);
      },
      error: (err) => console.error(err)
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}