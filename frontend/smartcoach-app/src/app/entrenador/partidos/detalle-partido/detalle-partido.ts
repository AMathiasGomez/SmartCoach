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

  puntosEquipo: number = 0;
  puntosRival: number = 0;

  posicionSeleccionada: number | null = null;
  mostrarModalFormacion: boolean = false;

  playerAnalysis: MatchAnalyticsResponse | null = null;
  loadingAnalytics: boolean = false;
  analyticsError: boolean = false;
  mostrarAnalytics: boolean = false;
  notificationMsg: string = '';
  showNotification: boolean = false;

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
      next: (data) =>  { 
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
        stats: {
          ataques: stats?.ataques || 0,
          recepciones: stats?.recepciones || 0,
          errores: stats?.errores || 0,
          bloqueos: stats?.bloqueos || 0
        }
      };
    });
  }

  iniciarPartido() {
    this.partidoService.updateEstado(this.partidoId, 'en_curso').subscribe(() => {
      this.partido.estado = 'en_curso';
    });
  }

  finalizarPartido() {
    if (!confirm('¿Realmente deseas FINALIZAR el partido?')) return;

    this.partidoService.updateEstado(this.partidoId, 'finalizado').subscribe({
      next: () => {
        this.partido.estado = 'finalizado';
        this.cargarEstadisticasPorSets();
        this.analizarRendimiento();
      },
      error: (err) => console.error(err)
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

    const playersData = this.tablaJugadores
      .filter(j => jugadoresEnCancha.includes(j.id))
      .map(j => ({
        player_id: j.id.toString(),
        name: j.nombre,
        blocks: j.stats.bloqueos,
        attacks: j.stats.ataques,
        receptions: j.stats.recepciones,
        errors: j.stats.errores
      }));

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

        const saveRequests = this.tablaJugadores.map(j =>
          this.partidoService.addEstadisticasPorSet(this.partidoId, setId, {
            jugador_id: j.id,
            ataques: j.stats.ataques,
            recepciones: j.stats.recepciones,
            errores: j.stats.errores,
            bloqueos: j.stats.bloqueos,
          })
        );

        forkJoin(saveRequests).subscribe({
          next: () => {
            // Reset stats y puntos
            this.tablaJugadores.forEach(j => {
              j.stats = { ataques: 0, recepciones: 0, errores: 0, bloqueos: 0 };
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
              this.analizarRendimientoFinalConDatos(response.totales_jugadores);
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
        if (data) {
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
        const playersData = estadisticas.map((e: any) => ({
          player_id: e.jugador_id.toString(),
          name: e.jugador_nombre,
          blocks: e.bloqueos,
          attacks: e.ataques,
          receptions: e.recepciones,
          errors: e.errores
        }));

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
}


