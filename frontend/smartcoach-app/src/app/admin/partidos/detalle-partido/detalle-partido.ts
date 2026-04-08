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
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, CommonModule],
  templateUrl: './detalle-partido.html',
  styleUrls: ['./detalle-partido.css'],
})
export class DetallePartido implements OnInit {

  partidoId!: number;
  partido: any;

  sets: any[] = [];
  jugadores: any[] = [];
  estadisticas: any[] = [];
  tablaJugadores: any[] = [];

  puntosEquipo: number = 0;
  puntosRival: number = 0;

  private historialPuntos: EstadoPuntos[] = [];

  constructor(
    private route: ActivatedRoute,
    private partidoService: PartidoService,
    public authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.partidoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPartido();
    this.cargarSets();
    this.cargarEstadisticas();
  }

  get puedeDeshacer(): boolean {
    return this.historialPuntos.length > 0;
  }

  get setsGanadosEquipo(): number {
    return this.sets.filter(s => s.puntos_equipo > s.puntos_rival).length;
  }

  get setsGanadosRival(): number {
    return this.sets.filter(s => s.puntos_rival > s.puntos_equipo).length;
  }

  get numeroSetActual(): number {
    return this.sets.length + 1;
  }

  get esUltimoSet(): boolean {
    return this.numeroSetActual === this.partido?.cantidad_sets;
  }

  get puntosObjetivo(): number {
    return this.esUltimoSet ? 15 : 25;
  }

  get diferenciaPuntos(): number {
    return Math.abs(this.puntosEquipo - this.puntosRival);
  }

  puedeFinalizarSet(): boolean {
    const max = Math.max(this.puntosEquipo, this.puntosRival);

    if (this.puntosEquipo === this.puntosRival) return false;
    if (max < this.puntosObjetivo) return false;
    if (this.diferenciaPuntos < 2) return false;

    return true;
  }

  // =============================
  // 🔄 CARGA DE DATOS
  // =============================

  cargarPartido() {
    this.partidoService.getPartidoById(this.partidoId).subscribe({
      next: (data) => {
        this.partido = data;
        this.cargarJugadores(this.partido.equipo_id);
      },
      error: (err: any) => console.error(err)
    });
  }

  cargarJugadores(equipoId: number) {
    this.partidoService.getJugadoresByEquipo(equipoId).subscribe({
      next: (data) => {
        this.jugadores = data;
        this.construirTabla();
      },
      error: (err: any) => console.error(err)
    });
  }

  cargarEstadisticas() {
    this.partidoService.getEstadisticas(this.partidoId).subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.construirTabla();
      },
      error: (err: any) => console.error(err)
    });
  }

  cargarSets() {
    this.partidoService.getSets(this.partidoId).subscribe({
      next: (data) => this.sets = data,
      error: (err: any) => console.error(err)
    });
  }

  construirTabla() {
    if (!this.jugadores.length) return;

    this.tablaJugadores = this.jugadores.map(jugador => {
      const stats = this.estadisticas.find(e => e.jugador_id === jugador.id);
      return {
        ...jugador,
        stats: {
          ataques: stats?.ataques || 0,
          recepciones: stats?.recepciones || 0,
          errores: stats?.errores || 0,
          bloqueos: stats?.bloqueos || 0
        }
      };
    });

    this.cd.detectChanges();
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

  cambiarStat(jugador: any, tipo: 'ataques' | 'recepciones' | 'errores' | 'bloqueos', valor: number) {
    jugador.stats[tipo] = Math.max(0, jugador.stats[tipo] + valor);
  }

  limpiarEstadisticas(jugador: any) {
    jugador.stats = { ataques: 0, recepciones: 0, errores: 0, bloqueos: 0 };
  }

  guardarTodos() {
    const updates = this.tablaJugadores.map(j => ({
      jugador_id: j.id,
      ataques: j.stats.ataques,
      recepciones: j.stats.recepciones,
      errores: j.stats.errores,
      bloqueos: j.stats.bloqueos
    }));

    this.partidoService.addEstadisticas(this.partidoId, updates).subscribe({
      next: () => alert('Estadísticas guardadas'),
      error: (err: any) => console.error(err)
    });
  }

  sumarPuntoEquipo() {
    this.historialPuntos.push({ puntosEquipo: this.puntosEquipo, puntosRival: this.puntosRival });
    this.puntosEquipo++;
  }

  sumarPuntoRival() {
    this.historialPuntos.push({ puntosEquipo: this.puntosEquipo, puntosRival: this.puntosRival });
    this.puntosRival++;
  }

  deshacerUltimoPunto() {
    if (!this.historialPuntos.length) return;
    const ultimo = this.historialPuntos.pop()!;
    this.puntosEquipo = ultimo.puntosEquipo;
    this.puntosRival = ultimo.puntosRival;
  }

  agregarSet() {
    if (!this.puedeFinalizarSet()) {
      alert('El set no cumple las reglas');
      return;
    }

    const data = {
      puntos_equipo: this.puntosEquipo,
      puntos_rival: this.puntosRival
    };

    this.partidoService.addSet(this.partidoId, data).subscribe({
      next: () => {

        this.puntosEquipo = 0;
        this.puntosRival = 0;
        this.historialPuntos = [];

        this.cargarSets();
        this.cargarPartido(); 
      },
      error: (err: any) => console.error(err)
    });
  }

  logOut() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}