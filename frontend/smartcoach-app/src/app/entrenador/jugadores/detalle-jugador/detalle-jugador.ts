import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { PartidoService } from '../../../services/partido/partido-service';
import { Jugador } from '../../../models/jugador.model';
import { AuthService } from '../../../services/auth/auth-service';
import { environment } from '../../../../environments/environment';

interface RadarAxis {
  key: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-detalle-jugador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-jugador.html',
  styleUrl: './detalle-jugador.css'
})
export class DetalleJugador implements OnInit, AfterViewInit {
  @ViewChild('radarCanvas') radarCanvasRef!: ElementRef<HTMLCanvasElement>;

  sidebarOpen = false;
  jugador: Jugador | null = null;
  loading = false;
  error = '';
  stats: any = null;
  statsLoading = false;

  analytics: any = null;
  analyticsLoading = false;
  private radarDrawn = false;
  fotoError = false;

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

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  ngAfterViewInit(): void {
    if (this.analytics?.analysis && !this.radarDrawn) {
      setTimeout(() => this.drawRadar(), 100);
    }
  }

  loadJugador(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de jugador no valido';
      return;
    }

    this.loading = true;
    this.jugadorService.getJugador(id).subscribe({
      next: (data) => {
        this.jugador = data as Jugador;
        this.fotoError = false;
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
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.stats = null;
        this.statsLoading = false;
      }
    });
  }

  loadAnalytics(jugadorId: number): void {
    this.analyticsLoading = true;
    this.jugadorService.getPlayerAnalytics(jugadorId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
        this.radarDrawn = false;
        this.cd.detectChanges();
        setTimeout(() => this.drawRadar(), 100);
      },
      error: () => {
        this.analytics = null;
        this.analyticsLoading = false;
      }
    });
  }

  drawRadar(): void {
    if (!this.radarCanvasRef || !this.analytics?.analysis) return;

    const canvas = this.radarCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const axes = this.getRadarAxes();
    if (!axes.length) return;

    const labels = axes.map(axis => axis.label);
    const values = axes.map(axis => axis.value / 100);

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.34;
    const n = labels.length;

    ctx.clearRect(0, 0, size, size);

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
    }

    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = 'rgba(99,179,237,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

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

    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = R * Math.max(0, Math.min(1, values[i]));
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#63B3ED';
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const labelR = R + 18;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#2B6CB0';
      ctx.fillText(labels[i], x, y);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#4A5568';
      ctx.fillText(`${Math.round(values[i] * 100)}`, x, y + 15);
    }

    this.radarDrawn = true;
  }

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
      Excelente: 'nivel-elite',
      Bueno: 'nivel-alto',
      Regular: 'nivel-medio',
      Bajo: 'nivel-bajo',
      Critico: 'nivel-bajo',
      Crítico: 'nivel-bajo',
      Elite: 'nivel-elite',
      Alto: 'nivel-alto',
      Medio: 'nivel-medio',
      Inicial: 'nivel-inicial'
    };
    return map[nivel] || '';
  }

  getOverallPercent(): number {
    return Math.round(this.getOverallDisplay());
  }

  getOverallDisplay(): number {
    const analysis = this.analytics?.analysis;
    return analysis?.overall_score_100 ?? ((analysis?.overall_score || 0) * 10);
  }

  getRadarAxes(): RadarAxis[] {
    const analysis = this.analytics?.analysis;

    if (analysis?.radar_axes) {
      return Object.entries(analysis.radar_axes).map(([key, value]) => ({
        key,
        label: analysis.radar_labels?.[key] || this.formatAxisLabel(key),
        value: Number(value) || 0,
      }));
    }

    const scores = analysis?.scores || {};
    return [
      { key: 'ataque', label: 'Ataque', value: Number(scores.ataques || 0) * 10 },
      { key: 'bloqueo', label: 'Bloqueo', value: Number(scores.bloqueos || 0) * 10 },
      { key: 'recepcion', label: 'Recepcion', value: Number(scores.recepciones || 0) * 10 },
      { key: 'consistencia', label: 'Consistencia', value: Number(scores.eficiencia || 0) * 10 },
    ];
  }

  formatAxisLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  getAxisFillClass(key: string): string {
    const map: Record<string, string> = {
      ataque: 'fill-ataques',
      bloqueo: 'fill-bloqueos',
      recepcion: 'fill-recepciones',
      defensa: 'fill-defensa',
      saque: 'fill-saque',
      armado: 'fill-armado',
      consistencia: 'fill-eficiencia',
    };
    return map[key] || 'fill-eficiencia';
  }

  getAxisIcon(key: string): string {
    const map: Record<string, string> = {
      ataque: 'trending_up',
      bloqueo: 'shield',
      recepcion: 'swap_vert',
      defensa: 'sports_handball',
      saque: 'ads_click',
      armado: 'hub',
      consistencia: 'verified',
    };
    return map[key] || 'analytics';
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

  getFotoUrl(fotoUrl?: string): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;

    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const path = fotoUrl.startsWith('/uploads') ? fotoUrl : `/uploads/jugadores/${fotoUrl}`;
    return `${baseUrl}${path}`;
  }

  onFotoError(): void {
    this.fotoError = true;
    this.cd.detectChanges();
  }

  eliminar(): void {
    if (!this.jugador?.id || !confirm('¿Deseas eliminar este jugador?')) return;
    this.jugadorService.eliminarJugador(this.jugador.id).subscribe({
      next: () => {
        alert('Jugador eliminado correctamente');
        this.back();
      },
      error: () => {
        alert('Error al eliminar el jugador');
      }
    });
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
