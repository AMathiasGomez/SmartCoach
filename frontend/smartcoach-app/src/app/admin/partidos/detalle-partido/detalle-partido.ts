import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PartidoService } from '../../../services/partido/partido-service';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EstadoPuntos {
  puntosEquipo: number;
  puntosRival: number;
}

@Component({
  selector: 'app-detalle-partido',
  imports: [RouterLink, NgClass, FormsModule, CommonModule],
  templateUrl: './detalle-partido.html',
  styleUrl: './detalle-partido.css',
})
export class DetallePartido implements OnInit {

  modalAbierto = false;
  jugadorSeleccionado: any = null;

  stats = {
    ataques: 0,
    recepciones: 0,
    errores: 0,
    bloqueos: 0
  };

  partidoId!: number;
  partido: any;
  sets: any[] = [];

  jugadores: any[] = [];
  estadisticas: any[] = [];

  tablaJugadores: any[] = [];

  puntosEquipo: number = 0;
  puntosRival: number = 0;

  private historialPuntos: EstadoPuntos[] = [];

  get puedeDeshacer(): boolean {
    return this.historialPuntos.length > 0;
  }

  constructor(
    private route: ActivatedRoute,
    private partidoService: PartidoService,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.partidoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPartido();
    this.cargarSets();
    this.cargarEstadisticas();
  }

  cargarPartido() {
    this.partidoService.getPartidoById(this.partidoId).subscribe({
      next: (data) => {
        this.partido = data;
        console.log("PARTIDO", data);


        this.cargarJugadores(this.partido.equipo_id);
      },
      error: (err) => console.error(err)
    });
  }

  cargarJugadores(equipoId: number) {
    this.partidoService.getJugadoresByEquipo(equipoId).subscribe({
      next: (data) => {
        console.log('JUGADORES:', data);
        this.jugadores = data;
        this.construirTabla();
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarEstadisticas() {
    this.partidoService.getEstadisticas(this.partidoId).subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.intentarConstruirTabla();
      },
      error: (err) => console.error(err)
    });
  }

  intentarConstruirTabla() {

  if (this.jugadores.length === 0) return;

  this.tablaJugadores = this.jugadores.map(jugador => {

    const stats = this.estadisticas.find(
      e => e.jugador_id === jugador.id
    );

    return {
      ...jugador,
      stats: stats || null
    };
  });

  console.log('TABLA FINAL:', this.tablaJugadores);
}

  cargarSets() {
    this.partidoService.getSets(this.partidoId).subscribe({
      next: (data) => {
        this.sets = data;
      },
      error: (err) => console.error(err)
    });
  }

  construirTabla() {

    // 🔥 NO construyas hasta tener jugadores
    if (this.jugadores.length === 0) return;

    // 🔥 SI no hay estadísticas, igual construye con null
    this.tablaJugadores = this.jugadores.map(jugador => {

      const stats = this.estadisticas.find(
        e => e.jugador_id === jugador.id
      );

      return {
        ...jugador,
        stats: stats || null
      };
    });

    console.log('TABLA FINAL:', this.tablaJugadores);
  }

  iniciarPartido() {
    this.partidoService.updateEstado(this.partidoId, 'en_curso').subscribe(() => {
      this.partido.estado = 'en_curso';
    });
  }

  finalizarPartido() {
    this.partidoService.updateEstado(this.partidoId, 'finalizado').subscribe(() => {
      this.partido.estado = 'finalizado';
    });
  }

  private guardarEstado(): void {
    this.historialPuntos.push({
      puntosEquipo: this.puntosEquipo,
      puntosRival: this.puntosRival
    });
  }

  sumarPuntoEquipo(): void {
    this.guardarEstado();
    this.puntosEquipo++;
  }

  sumarPuntoRival(): void {
    this.guardarEstado();
    this.puntosRival++;
  }

  deshacerUltimoPunto(): void {
    if (!this.puedeDeshacer) return;

    const estadoAnterior = this.historialPuntos.pop()!;
    this.puntosEquipo = estadoAnterior.puntosEquipo;
    this.puntosRival = estadoAnterior.puntosRival;
  }

  agregarSet() {
    if (!this.puntosEquipo || !this.puntosRival) return;

    const data = {
      puntos_equipo: this.puntosEquipo,
      puntos_rival: this.puntosRival
    };

    this.partidoService.addSet(this.partidoId, data).subscribe(() => {
      this.puntosEquipo = 0;
      this.puntosRival = 0;
      this.historialPuntos = [];
      this.cargarSets();
    });
  }

  abrirModal(jugador: any) {
    this.jugadorSeleccionado = jugador;
    this.modalAbierto = true;


    this.stats = {
      ataques: 0,
      recepciones: 0,
      errores: 0,
      bloqueos: 0
    };
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardarEstadisticas() {
    const data = {
      jugador_id: this.jugadorSeleccionado.id,
      ataques: this.stats.ataques || 0,
      recepciones: this.stats.recepciones || 0,
      errores: this.stats.errores || 0,
      bloqueos: this.stats.bloqueos || 0
    };

    this.partidoService.addEstadisticas(this.partidoId, data).subscribe({
      next: () => {
        this.cerrarModal();
        console.log('Estadísticas guardadas');

        this.modalAbierto = false;
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}