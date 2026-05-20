import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnalyticsService, MatchAnalyticsResponse } from '../../../services/analytics/analytics.service';
import { AuthService } from '../../../services/auth/auth-service';
import { PartidoService } from '../../../services/partido/partido-service';
import { forkJoin } from 'rxjs';

interface EstadoPuntos {
  puntosEquipo: number;
  puntosRival: number;
}

interface StatField {
  key: string;
  label: string;
  negative?: boolean;
}

const POSITION_STAT_FIELDS: Record<string, StatField[]> = {
  Punta: [
    { key: 'ataques_positivos', label: 'Ataques +' },
    { key: 'errores_ataque', label: 'Errores ataque', negative: true },
    { key: 'aces', label: 'Aces' },
    { key: 'errores_saque', label: 'Errores saque', negative: true },
    { key: 'bloqueos_positivos', label: 'Bloqueos +' },
    { key: 'recepciones_positivas', label: 'Recepciones +' },
    { key: 'recepciones_negativas', label: 'Recepciones -', negative: true },
    { key: 'defensas_positivas', label: 'Defensas +' },
    { key: 'defensas_negativas', label: 'Defensas -', negative: true },
  ],
  Opuesto: [
    { key: 'ataques_positivos', label: 'Ataques +' },
    { key: 'errores_ataque', label: 'Errores ataque', negative: true },
    { key: 'aces', label: 'Aces' },
    { key: 'errores_saque', label: 'Errores saque', negative: true },
    { key: 'bloqueos_positivos', label: 'Bloqueos +' },
    { key: 'errores_bloqueo', label: 'Errores bloqueo', negative: true },
  ],
  Central: [
    { key: 'ataques_positivos', label: 'Ataques +' },
    { key: 'errores_ataque', label: 'Errores ataque', negative: true },
    { key: 'bloqueos_positivos', label: 'Bloqueos +' },
    { key: 'errores_bloqueo', label: 'Errores bloqueo', negative: true },
  ],
  Armador: [
    { key: 'asistencias', label: 'Asistencias' },
    { key: 'errores_armado', label: 'Errores armado', negative: true },
    { key: 'aces', label: 'Aces' },
    { key: 'errores_saque', label: 'Errores saque', negative: true },
    { key: 'bloqueos_positivos', label: 'Bloqueos +' },
    { key: 'defensas_positivas', label: 'Defensas +' },
  ],
  Libero: [
    { key: 'recepciones_positivas', label: 'Recepciones +' },
    { key: 'recepciones_negativas', label: 'Recepciones -', negative: true },
    { key: 'defensas_positivas', label: 'Defensas +' },
    { key: 'defensas_negativas', label: 'Defensas -', negative: true },
  ],
};

@Component({
  selector: 'app-detalle-partido',
  imports: [RouterLink, NgClass, FormsModule, CommonModule],
  templateUrl: './detalle-partido.html',
  styleUrl: './detalle-partido.css',
})
export class DetallePartido implements OnInit {


  get isFormacionCompleta(): boolean {
    return this.formacion.filter(j => j !== null).length === 7;
  }

  partidoId!: number;
  partido: any;
  sidebarOpen: boolean = false;

  sets: any[] = [];
  jugadoresConvocados: any[] = [];
  estadisticas: any[] = [];
  estadisticasPorSets: any[] = []; // Stats grouped by set for final view

  tablaJugadores: any[] = [];
  formacion: (any | null)[] = [null, null, null, null, null, null, null];
  posicionesEstadisticas: string[] = ['Punta', 'Opuesto', 'Central', 'Armador', 'Libero'];
  posicionEstadisticasActiva: string = 'Punta';
  estadisticasDetalladasAcumuladas: Record<string, any> = {};

  puntosEquipo: number = 0;
  puntosRival: number = 0;

  posicionSeleccionada: number | null = null;
  mostrarModalFormacion: boolean = false;

  playerAnalysis: MatchAnalyticsResponse | null = null;
  loadingAnalytics: boolean = false;
  analyticsError: boolean = false;
  mostrarAnalytics: boolean = false;
  actualizandoEstadoPartido: boolean = false;
  notificationMsg: string = '';
  showNotification: boolean = false;

  modalDetalleAbierto: boolean = false;
  jugadorSeleccionado: any = null;

  private historialPuntos: EstadoPuntos[] = [];

  constructor(
    private route: ActivatedRoute,
    private partidoService: PartidoService,
    public authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit(): void {
    this.partidoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPartido();
    this.cargarSets();
    this.cargarJugadoresYEstadisticas();
    this.cargarAnalyticsGuardado();
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

  get puedeEquipoSumar(): boolean {
    return this.puedeSumarPunto(this.puntosEquipo, this.puntosRival);
  }

  get puedeRivalSumar(): boolean {
    return this.puedeSumarPunto(this.puntosRival, this.puntosEquipo);
  }

  get jugadoresEnBanquillo(): any[] {
    const enCancha = this.formacion.filter(j => j !== null).map(j => j.id);
    return this.jugadoresConvocados.filter(j => !enCancha.includes(j.id));
  }

  get camposEstadisticasActivos(): StatField[] {
    return POSITION_STAT_FIELDS[this.posicionEstadisticasActiva] || POSITION_STAT_FIELDS['Punta'];
  }

  get jugadoresFiltradosPorPosicion(): any[] {
    return this.tablaJugadores.filter(j => this.normalizarPosicion(j.posicion) === this.posicionEstadisticasActiva);
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

  puedeSumarPunto(puntosPropios: number, puntosRival: number): boolean {
    if (this.puedeFinalizarSet()) return false;

    if (puntosPropios < this.puntosObjetivo) return true;

    return puntosRival >= puntosPropios - 1;
  }

  cargarPartido() {
    this.partidoService.getPartidoById(this.partidoId).subscribe({
      next: (data) => {
        this.partido = data;
        this.cd.detectChanges();
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
        this.construirTabla();
        this.cd.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarSets() {
    this.partidoService.getSets(this.partidoId).subscribe({
      next: (data) => {
        this.sets = data;
        this.cd.detectChanges();
      },
      error: (err: any) => console.error(err)
    });
  }

  construirTabla() {
    if (!this.jugadoresConvocados.length) return;

    this.tablaJugadores = this.jugadoresConvocados.map(jugador => {
      const stats = this.estadisticas.find(e => e.jugador_id === jugador.id);
      return {
        ...jugador,
        posicion: this.normalizarPosicion(jugador.posicion),
        stats: this.crearStatsDetalladas(stats)
      };
    });
  }

  iniciarPartido() {
    if (this.actualizandoEstadoPartido || !this.isFormacionCompleta) return;

    const estadoAnterior = this.partido.estado;
    this.actualizandoEstadoPartido = true;
    this.partido = { ...this.partido, estado: 'en_curso' };
    this.cd.detectChanges();

    this.partidoService.updateEstado(this.partidoId, 'en_curso').subscribe({
      next: () => {
        this.actualizandoEstadoPartido = false;
        this.partido = { ...this.partido, estado: 'en_curso' };
        this.showNotif('Partido iniciado correctamente.');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.actualizandoEstadoPartido = false;
        this.partido = { ...this.partido, estado: estadoAnterior };
        this.cd.detectChanges();
      }
    });
  }

  finalizarPartido() {
    if (this.actualizandoEstadoPartido) return;
    if (!confirm('¿Realmente deseas FINALIZAR el partido?')) return;

    this.actualizandoEstadoPartido = true;
    this.partidoService.updateEstado(this.partidoId, 'finalizado').subscribe({
      next: () => {
        this.actualizandoEstadoPartido = false;
        this.partido = { ...this.partido, estado: 'finalizado' };
        this.cargarEstadisticasPorSets();
        this.analizarRendimiento();
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.actualizandoEstadoPartido = false;
        this.cd.detectChanges();
      }
    });
  }

  cargarEstadisticasPorSets() {
    this.partidoService.getEstadisticasPorSets(this.partidoId).subscribe({
      next: (data) => {
        this.estadisticasPorSets = data;
        console.log('Stats por sets:', this.estadisticasPorSets);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error loading stats by sets:', err)
    });
  }

  normalizarPosicion(posicion: string): string {
    const valor = (posicion || 'Punta').toLowerCase().trim();
    const mapa: Record<string, string> = {
      punta: 'Punta',
      opuesto: 'Opuesto',
      central: 'Central',
      armador: 'Armador',
      libero: 'Libero',
      líbero: 'Libero',
    };
    return mapa[valor] || 'Punta';
  }

  crearStatsDetalladas(stats?: any): any {
    return {
      ataques_positivos: Number(stats?.ataques_positivos ?? stats?.ataques ?? 0),
      errores_ataque: Number(stats?.errores_ataque ?? stats?.errores ?? 0),
      aces: Number(stats?.aces ?? 0),
      errores_saque: Number(stats?.errores_saque ?? 0),
      bloqueos_positivos: Number(stats?.bloqueos_positivos ?? stats?.bloqueos ?? 0),
      errores_bloqueo: Number(stats?.errores_bloqueo ?? 0),
      recepciones_positivas: Number(stats?.recepciones_positivas ?? stats?.recepciones ?? 0),
      recepciones_negativas: Number(stats?.recepciones_negativas ?? 0),
      defensas_positivas: Number(stats?.defensas_positivas ?? 0),
      defensas_negativas: Number(stats?.defensas_negativas ?? 0),
      asistencias: Number(stats?.asistencias ?? 0),
      errores_armado: Number(stats?.errores_armado ?? 0),
    };
  }

  cambiarPosicionEstadisticas(posicion: string): void {
    this.posicionEstadisticasActiva = posicion;
  }

  cambiarStat(jugador: any, tipo: string, valor: number) {
    jugador.stats[tipo] = Math.max(0, jugador.stats[tipo] + valor);
  }

  limpiarEstadisticas(jugador: any) {
    jugador.stats = this.crearStatsDetalladas();
  }

  resumenLegacyStats(jugador: any): any {
    const stats = jugador.stats || {};
    return {
      ataques: Number(stats.ataques_positivos || 0),
      recepciones: Number(stats.recepciones_positivas || 0),
      bloqueos: Number(stats.bloqueos_positivos || 0),
      errores:
        Number(stats.errores_ataque || 0) +
        Number(stats.errores_saque || 0) +
        Number(stats.errores_bloqueo || 0) +
        Number(stats.recepciones_negativas || 0) +
        Number(stats.defensas_negativas || 0) +
        Number(stats.errores_armado || 0),
    };
  }

  construirPayloadAnalisis(jugadores: any[]): any[] {
    return jugadores.map(j => ({
      player_id: j.id?.toString() || j.player_id?.toString(),
      name: j.nombre || j.name || 'Jugador',
      position: this.normalizarPosicion(j.posicion || j.position),
      ...this.resumenLegacyStats(j),
      ...j.stats,
    }));
  }

  acumularEstadisticasDetalladas(): void {
    this.tablaJugadores.forEach(jugador => {
      const id = jugador.id.toString();
      const actual = this.estadisticasDetalladasAcumuladas[id] || {
        ...jugador,
        stats: this.crearStatsDetalladas(),
      };

      Object.keys(this.crearStatsDetalladas()).forEach(key => {
        actual.stats[key] = Number(actual.stats[key] || 0) + Number(jugador.stats[key] || 0);
      });

      this.estadisticasDetalladasAcumuladas[id] = actual;
    });
  }

  jugadoresAcumuladosParaAnalisis(): any[] {
    const acumulados = Object.values(this.estadisticasDetalladasAcumuladas);
    return acumulados.length ? acumulados : this.tablaJugadores;
  }

  guardarTodos() {
    const updates = this.tablaJugadores.map(j => ({
      jugador_id: j.id,
      ...this.resumenLegacyStats(j),
      ...j.stats
    }));

    this.partidoService.addEstadisticas(this.partidoId, updates).subscribe({
      next: () => alert('Estadísticas guardadas'),
      error: (err: any) => console.error(err)
    });
  }

  analizarRendimiento() {


    if (this.tablaJugadores.length === 0) {
      alert('Carga primero las estadísticas de los jugadores');
      return;
    }

    this.loadingAnalytics = true;
    this.analyticsError = false;
    this.mostrarAnalytics = false;

    const jugadoresEnCancha = this.formacion
      .filter(j => j !== null)
      .map(j => j.id);

    const playersData = this.construirPayloadAnalisis(
      this.tablaJugadores.filter(j => jugadoresEnCancha.includes(j.id))
    );

    console.log('>>> jugadoresEnCancha:', jugadoresEnCancha);
    console.log('>>> playersData:', playersData);

    if (playersData.length === 0) {
      alert('Primero arma la formación en la cancha');
      this.loadingAnalytics = false;
      return;
    }

    this.analyticsService.analyzeMatch(this.partidoId, playersData).subscribe({
      next: (response) => {
        this.playerAnalysis = response;
        this.mostrarAnalytics = true;
        this.loadingAnalytics = false;
        this.partidoService.saveAnalytics(this.partidoId, response).subscribe();
        this.showNotif('🎯 Análisis sklearn completado');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Analytics error:', err);
        this.analyticsError = true;
        this.loadingAnalytics = false;
        alert('Error al analizar rendimiento. Verifica que el backend esté corriendo.');
      }
    });
  }

  sumarPuntoEquipo() {
    if (!this.puedeEquipoSumar) return;
    this.historialPuntos.push({ puntosEquipo: this.puntosEquipo, puntosRival: this.puntosRival });
    this.puntosEquipo++;
  }

  sumarPuntoRival() {
    if (!this.puedeRivalSumar) return;
    this.historialPuntos.push({ puntosEquipo: this.puntosEquipo, puntosRival: this.puntosRival });
    this.puntosRival++;
  }


  deshacerUltimoPunto() {
    if (!this.historialPuntos.length) return;
    const ultimo = this.historialPuntos.pop()!;
    this.puntosEquipo = ultimo.puntosEquipo;
    this.puntosRival = ultimo.puntosRival;
  }

  showNotif(msg: string) {
    this.notificationMsg = msg;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
      this.cd.detectChanges();
    }, 5000);
    this.cd.detectChanges();
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
      next: (response) => {
        const setId = response.set_id;
        const partidoFinalizado = !!response.ganador_partido;
        this.acumularEstadisticasDetalladas();

        const saveRequests = this.tablaJugadores.map(j =>
          this.partidoService.addEstadisticasPorSet(this.partidoId, setId, {
            jugador_id: j.id,
            ...this.resumenLegacyStats(j),
            ...j.stats
          })
        );

        forkJoin(saveRequests).subscribe({
          next: () => {
            // Reset stats y puntos
            this.tablaJugadores.forEach(j => {
              j.stats = this.crearStatsDetalladas();
            });
            this.puntosEquipo = 0;
            this.puntosRival = 0;
            this.historialPuntos = [];

            this.cargarSets();
            this.cargarPartido();

            if (partidoFinalizado) {
              // El partido terminó — correr análisis con totales del partido
              this.showNotif('🏆 Partido finalizado. Generando análisis final...');
              this.cargarEstadisticasPorSets();
              this.analizarRendimientoFinalDetallado();
            } else {
              this.showNotif('✅ Set guardado correctamente.');
            }
          },
          error: console.error
        });
      },
      error: (err: any) => console.error(err)
    }
    );
  }

  logOut() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnNav() {
    this.sidebarOpen = false;
  }

  cargarAnalyticsGuardado(): void {
    this.partidoService.getAnalytics(this.partidoId).subscribe({
      next: (data) => {
        if (data && data.analysis) {
          this.playerAnalysis = data;
          this.mostrarAnalytics = true;
          this.cd.detectChanges();
        }
      },
      error: () => { }
    });
  }

  analizarRendimientoFinal() {
    this.loadingAnalytics = true;
    this.analyticsError = false;
    this.mostrarAnalytics = false;

    this.partidoService.getEstadisticas(this.partidoId).subscribe({
      next: (estadisticas: any[]) => {
        // Sin filtro — todos los jugadores con estadísticas
        const playersData = estadisticas.map((e: any) => {
          const jugador = this.jugadoresConvocados.find(j => j.id === e.jugador_id);
          return {
            player_id: e.jugador_id.toString(),
            name: e.jugador_nombre,
            position: this.normalizarPosicion(jugador?.posicion),
            attacks: e.ataques,
            receptions: e.recepciones,
            blocks: e.bloqueos,
            errors: e.errores
          };
        });

        if (playersData.length === 0) {
          this.loadingAnalytics = false;
          return;
        }

        this.analyticsService.analyzeMatch(this.partidoId, playersData).subscribe({
          next: (response) => {
            this.playerAnalysis = response;
            this.mostrarAnalytics = true;
            this.loadingAnalytics = false;
            this.partidoService.saveAnalytics(this.partidoId, response).subscribe();
            this.showNotif('🎯 Análisis sklearn completado');
            this.cd.detectChanges();
          },
          error: (err) => {
            console.error('Analytics error:', err);
            this.analyticsError = true;
            this.loadingAnalytics = false;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.loadingAnalytics = false;
      }
    });
  }

  analizarRendimientoFinalConDatos(totales: any[]) {
    console.log('>>> totales recibidos:', totales); // ← agrega esto
    console.log('>>> jugadoresConvocados:', this.jugadoresConvocados);

    this.loadingAnalytics = true;
    this.analyticsError = false;
    this.mostrarAnalytics = false;

    // Necesitamos los nombres — cruzamos con jugadoresConvocados
    const playersData = totales.map((e: any) => {
      const jugador = this.jugadoresConvocados.find(j => j.id === e.jugador_id);
      return {
        player_id: e.jugador_id.toString(),
        name: jugador?.nombre || 'Jugador',
        position: jugador?.posicion || 'Punta',
        blocks: Number(e.bloqueos),
        attacks: Number(e.ataques),
        receptions: Number(e.recepciones),
        errors: Number(e.errores)
      };
    });

    if (playersData.length === 0) {
      this.loadingAnalytics = false;
      return;
    }

    this.analyticsService.analyzeMatch(this.partidoId, playersData).subscribe({
      next: (response) => {
        this.playerAnalysis = response;
        this.mostrarAnalytics = true;
        this.loadingAnalytics = false;
        this.partidoService.saveAnalytics(this.partidoId, response).subscribe();
        this.showNotif('🎯 Análisis sklearn completado');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Analytics error:', err);
        this.analyticsError = true;
        this.loadingAnalytics = false;
      }
    });
  }

  analizarRendimientoFinalDetallado() {
    this.loadingAnalytics = true;
    this.analyticsError = false;
    this.mostrarAnalytics = false;

    this.partidoService.getEstadisticas(this.partidoId).subscribe({
      next: (estadisticas: any[]) => {
        const playersData = estadisticas.map((e: any) => {
          const jugador = this.jugadoresConvocados.find(j => j.id === e.jugador_id);
          return {
            player_id: e.jugador_id.toString(),
            name: e.jugador_nombre,
            position: this.normalizarPosicion(jugador?.posicion),
            // campos detallados
            ataques_positivos: Number(e.ataques_positivos || 0),
            errores_ataque: Number(e.errores_ataque || 0),
            aces: Number(e.aces || 0),
            errores_saque: Number(e.errores_saque || 0),
            bloqueos_positivos: Number(e.bloqueos_positivos || 0),
            errores_bloqueo: Number(e.errores_bloqueo || 0),
            recepciones_positivas: Number(e.recepciones_positivas || 0),
            recepciones_negativas: Number(e.recepciones_negativas || 0),
            defensas_positivas: Number(e.defensas_positivas || 0),
            defensas_negativas: Number(e.defensas_negativas || 0),
            asistencias: Number(e.asistencias || 0),
            errores_armado: Number(e.errores_armado || 0),
            // legacy para compatibilidad
            attacks: Number(e.ataques || 0),
            receptions: Number(e.recepciones || 0),
            blocks: Number(e.bloqueos || 0),
            errors: Number(e.errores || 0),
          };
        });

        if (playersData.length === 0) {
          this.loadingAnalytics = false;
          return;
        }

        this.analyticsService.analyzeMatch(this.partidoId, playersData).subscribe({
          next: (response) => {
            this.playerAnalysis = response;
            this.mostrarAnalytics = true;
            this.loadingAnalytics = false;
            this.partidoService.saveAnalytics(this.partidoId, response).subscribe();
            this.showNotif('Análisis por posición completado');
            this.cd.detectChanges();
          },
          error: (err) => {
            console.error('Analytics error:', err);
            this.analyticsError = true;
            this.loadingAnalytics = false;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.loadingAnalytics = false;
      }
    });
  }


  abrirModalDetalle(player: any): void {
    this.jugadorSeleccionado = player;
    this.modalDetalleAbierto = true;
    this.cd.detectChanges();
  }

  cerrarModalDetalle(): void {
    this.modalDetalleAbierto = false;
    this.jugadorSeleccionado = null;
  }

  getFotoJugador(playerId: string): string | null {
    const jugador = this.jugadoresConvocados.find(j => j.id.toString() === playerId);
    if (!jugador?.foto) return null;
    // La foto viene como nombre de archivo, necesitamos la URL completa
    return `http://localhost:3006/uploads/jugadores/${jugador.foto}`;
  }

  getNumeroJugador(playerId: string): string {
    const jugador = this.jugadoresConvocados.find(j => j.id.toString() === playerId);
    return jugador?.numero?.toString() || '';
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // Mostrar placeholder si la imagen falla
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder) placeholder.style.display = 'flex';
  }

  getMetricasRelevantes(player: any): { label: string; value: number }[] {
    if (!player.metric_scores) return [];

    const LABEL_MAP: Record<string, string> = {
      ofensiva: 'Ataque',
      recepcion: 'Recepción',
      defensa: 'Defensa',
      bloqueo: 'Bloqueo',
      saque: 'Saque',
      armado: 'Armado',
      disciplina: 'Disciplina',
    };

    // Métricas relevantes por posición
    const POSITION_METRICS: Record<string, string[]> = {
      Punta: ['ofensiva', 'recepcion', 'defensa', 'saque', 'bloqueo'],
      Opuesto: ['ofensiva', 'bloqueo', 'saque', 'disciplina'],
      Central: ['bloqueo', 'ofensiva', 'disciplina'],
      Armador: ['armado', 'defensa', 'saque', 'bloqueo'],
      Libero: ['recepcion', 'defensa', 'disciplina'],
    };

    const metricas = POSITION_METRICS[player.position] || Object.keys(LABEL_MAP);

    return metricas
      .filter(key => player.metric_scores[key] !== undefined)
      .map(key => ({
        label: LABEL_MAP[key] || key,
        value: Math.round(player.metric_scores[key])
      }));
  }

  getBarColor(value: number): string {
    if (value >= 75) return 'bar-green';
    if (value >= 55) return 'bar-blue';
    if (value >= 35) return 'bar-yellow';
    return 'bar-red';
  }

}


