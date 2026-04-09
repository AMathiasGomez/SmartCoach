import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PartidoService } from '../../../services/partido/partido-service';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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
  jugadoresConvocados: any[] = [];
  estadisticas: any[] = [];

  tablaJugadores: any[] = [];
  formacion: (any | null)[] = [null, null, null, null, null, null];

  puntosEquipo: number = 0;
  puntosRival: number = 0;

  posicionSeleccionada: number | null = null;
  mostrarModalFormacion: boolean = false;

  private historialPuntos: EstadoPuntos[] = [];

  constructor(
    private route: ActivatedRoute,
    private partidoService: PartidoService,
    public authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.partidoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPartido();
    this.cargarSets();
    this.cargarJugadoresYEstadisticas();
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

  get jugadoresEnBanquillo(): any[] {
    const enCancha = this.formacion.filter(j => j !== null).map(j => j.id);
    return this.jugadoresConvocados.filter(j => !enCancha.includes(j.id));
  }

  abrirSeleccion(indicePosicion: number): void {
    this.posicionSeleccionada = indicePosicion;
    this.mostrarModalFormacion = true;
  }

  asignarJugador(jugador: any): void {
    if (this.posicionSeleccionada === null) return;

    // Si el jugador ya estaba en otra posición, lo quitamos de ahí
    const posAnterior = this.formacion.findIndex(j => j?.id === jugador.id);
    if (posAnterior !== -1) {
      this.formacion[posAnterior] = null;
    }

    this.formacion[this.posicionSeleccionada] = jugador;
    this.cerrarModal();
  }

  quitarJugadorDePosicion(indicePosicion: number): void {
    this.formacion[indicePosicion] = null;
  }

  cerrarModal(): void {
    this.mostrarModalFormacion = false;
    this.posicionSeleccionada = null;
  }

  shortName(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ').slice(0, 2).join(' ');
  }

  puedeFinalizarSet(): boolean {
    const max = Math.max(this.puntosEquipo, this.puntosRival);
    const diferencia = Math.abs(this.puntosEquipo - this.puntosRival);

    if (this.puntosEquipo === this.puntosRival) return false;
    if (max < this.puntosObjetivo) return false;
    if (diferencia < 2) return false;

    return true;
  }

  cargarPartido() {
    this.partidoService.getPartidoById(this.partidoId).subscribe({
      next: (data) => {
        this.partido = data;
        this.cargarJugadoresYEstadisticas();
      },
      error: (err: any) => console.error(err)
    });
  }

  cargarJugadoresYEstadisticas(): void {
    forkJoin({
      jugadores: this.partidoService.getJugadoresByPartido(this.partidoId),
      estadisticas: this.partidoService.getEstadisticas(this.partidoId)
    }).subscribe({
      next: ({ jugadores, estadisticas }) => {
        this.jugadoresConvocados = jugadores;
        this.estadisticas = estadisticas;
        this.construirTabla(); // se ejecuta solo cuando AMBAS respondieron
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarSets() {
    this.partidoService.getSets(this.partidoId).subscribe({
      next: (data) => this.sets = data,
      error: (err: any) => console.error(err)
    });
  }

  construirTabla() {
    if (!this.jugadoresConvocados.length) return;

    this.tablaJugadores = this.jugadoresConvocados.map(jugador => {
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
    alert("Realmente")

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
      numero_set: this.numeroSetActual,
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