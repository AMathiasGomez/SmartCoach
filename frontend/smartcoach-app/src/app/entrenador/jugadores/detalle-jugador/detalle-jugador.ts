import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { PartidoService } from '../../../services/partido/partido-service';
import { Jugador } from '../../../models/jugador.model';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-detalle-jugador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-jugador.html',
  styleUrl: './detalle-jugador.css'
})
export class DetalleJugador implements OnInit, AfterViewInit {
  @ViewChild('radarCanvas') radarCanvasRef!: ElementRef<HTMLCanvasElement>;

  jugador: Jugador | null = null;
  loading = false;
  error = '';
  stats: any = null;
  statsLoading = false;

  // Analytics ML
  analytics: any = null;
  analyticsLoading = false;
  private radarDrawn = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jugadorService: JugadorService,
    private partidoService: PartidoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadJugador();
  }

  ngAfterViewInit(): void {
    // El canvas se dibuja después de que analytics cargue (ver drawRadar)
  }

  loadJugador(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ID de jugador no válido'; return; }

    this.loading = true;
    this.jugadorService.getJugador(id).subscribe({
      next: (data) => {
        this.jugador = data as Jugador;
        this.loading = false;
        this.loadEstadisticas(id);
        this.loadAnalytics(id);
        this.cd.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar el jugador';
        this.loading = false;
      }
    });
  }

  loadEstadisticas(jugadorId: number): void {
    this.statsLoading = true;
    this.partidoService.getEstadisticasJugador(jugadorId).subscribe({
      next: (data) => { this.stats = data; this.statsLoading = false; this.cd.detectChanges(); },
      error: () => { this.stats = null; this.statsLoading = false; }
    });
  }

  loadAnalytics(jugadorId: number): void {
    this.analyticsLoading = true;
    this.jugadorService.getPlayerAnalytics(jugadorId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
        this.cd.detectChanges();
        // Dibuja el radar después del próximo ciclo de detección de cambios
        setTimeout(() => this.drawRadar(), 100);
      },
      error: () => {
        this.analytics = null;
        this.analyticsLoading = false;
      }
    });
  }

  // ─── Radar Chart (Canvas puro, sin dependencias externas) ──────────────────
  drawRadar(): void {
    if (!this.radarCanvasRef || !this.analytics?.analysis) return;

    const canvas = this.radarCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scores = this.analytics.analysis.scores;
    const labels = ['Ataques', 'Bloqueos', 'Recepciones', 'Eficiencia'];
    const values = [
      scores.ataques / 10,
      scores.bloqueos / 10,
      scores.recepciones / 10,
      scores.eficiencia / 10
    ];

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.36;
    const n = labels.length;

    ctx.clearRect(0, 0, size, size);

    // ── Círculos de fondo
    for (let level = 1; level <= 5; level++) {
      const r = (R * level) / 5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(99,179,237,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (level === 5) {
        ctx.fillStyle = 'rgba(235,248,255,0.04)';
        ctx.fill();
      }
    }

    // ── Ejes
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = 'rgba(99,179,237,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── Polígono de datos
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = R * Math.max(0, Math.min(1, values[i]));
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, 'rgba(66,153,225,0.55)');
    grad.addColorStop(1, 'rgba(49,130,206,0.20)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#4299E1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // ── Puntos en vértices
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = R * Math.max(0, Math.min(1, values[i]));
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#63B3ED';
      ctx.fill();
    }

    // ── Etiquetas
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const labelR = R + 10;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.fillStyle = '#2B6CB0';
      ctx.fillText(labels[i], x, y);
      // Score debajo
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#4A5568';
      ctx.fillText(`${(values[i] * 10).toFixed(1)}`, x, y + 15);
      ctx.font = 'bold 13px system-ui, sans-serif';
    }

    this.radarDrawn = true;
  }

  // ─── Helpers de template ────────────────────────────────────────────────────
  getTendenciaIcon(): string {
    const t = this.analytics?.analysis?.tendencia;
    if (t === 'mejorando') return 'trending_up';
    if (t === 'bajando') return 'trending_down';
    return 'trending_flat';
  }

  getTendenciaClass(): string {
    const t = this.analytics?.analysis?.tendencia;
    if (t === 'mejorando') return 'tendencia-up';
    if (t === 'bajando') return 'tendencia-down';
    return 'tendencia-flat';
  }

  getNivelClass(): string {
    const nivel = this.analytics?.analysis?.nivel || '';
    const map: Record<string, string> = {
      'Élite': 'nivel-elite', 'Alto': 'nivel-alto',
      'Medio': 'nivel-medio', 'Bajo': 'nivel-bajo', 'Inicial': 'nivel-inicial'
    };
    return map[nivel] || '';
  }

  getOverallPercent(): number {
    return Math.round((this.analytics?.analysis?.overall_score || 0) * 10);
  }

  calculateAge(): string {
    if (!this.jugador?.fecha_nacimiento) return '';
    const birthDate = new Date(this.jugador.fecha_nacimiento);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
  }

  back(): void { this.router.navigate(['/ver-jugadores-e']); }
  editar(): void { if (this.jugador?.id) this.router.navigate(['/editar-jugador', this.jugador.id]); }

  eliminar(): void {
    if (!this.jugador?.id || !confirm('¿Deseas eliminar este jugador?')) return;
    this.jugadorService.eliminarJugador(this.jugador.id).subscribe({
      next: () => { alert('Jugador eliminado correctamente'); this.back(); },
      error: () => { alert('Error al eliminar el jugador'); }
    });
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}