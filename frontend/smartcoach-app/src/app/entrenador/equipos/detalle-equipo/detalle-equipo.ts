import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { Equipo } from '../../../models/equipo.model';
import { Jugador } from '../../../models/jugador.model';
import { AuthService } from '../../../services/auth/auth-service';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface TeamAxis {
  key: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-detalle-equipo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-equipo.html',
  styleUrls: ['./detalle-equipo.css']
})
export class DetalleEquipo implements OnInit, AfterViewInit {
  @ViewChild('radarCanvasEquipo') radarCanvasRef!: ElementRef<HTMLCanvasElement>;

  equipo: Equipo | null = null;
  jugadores: Jugador[] = [];
  loading = false;
  error = '';

  analytics: any = null;
  analyticsLoading = false;
  private radarDrawn = false;
  private baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipoService: EquipoService,
    private jugadorService: JugadorService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEquipo();
  }

  ngAfterViewInit(): void {
    if (this.analytics?.analysis && !this.radarDrawn) {
      setTimeout(() => this.drawRadar(), 120);
    }
  }

  loadEquipo(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de equipo no valido';
      return;
    }

    this.loading = true;
    forkJoin({
      equipo: this.equipoService.getEquipo(id),
      jugadores: this.jugadorService.getJugadoresByEquipo(id)
    }).subscribe({
      next: ({ equipo, jugadores }) => {
        this.equipo = equipo as Equipo;
        this.jugadores = jugadores;
        this.loading = false;
        this.loadAnalytics(id);
        this.cd.detectChanges();
      },
      error: () => {
        this.error = 'Error al cargar el equipo';
        this.loading = false;
      }
    });
  }

  loadAnalytics(equipoId: number): void {
    this.analyticsLoading = true;
    this.equipoService.getTeamAnalytics(equipoId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
        this.radarDrawn = false;
        this.cd.detectChanges();
        setTimeout(() => this.drawRadar(), 120);
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

    const axes = this.getTeamAxes();
    if (!axes.length) return;

    const labels = axes.map(axis => axis.label);
    const values = axes.map(axis => axis.value / 100);
    const sz = canvas.width;
    const cx = sz / 2;
    const cy = sz / 2;
    const R = sz * 0.32;
    const n = labels.length;

    ctx.clearRect(0, 0, sz, sz);

    for (let lv = 1; lv <= 5; lv++) {
      const r = R * lv / 5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 2 * i / n - Math.PI / 2;
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
          : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(49,130,206,0.20)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.strokeStyle = 'rgba(49,130,206,0.30)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      const r = R * Math.max(0, Math.min(1, values[i]));
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
        : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(49,130,206,0.55)');
    g.addColorStop(1, 'rgba(49,130,206,0.15)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#3182CE';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      const r = R * Math.max(0, Math.min(1, values[i]));
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#63B3ED';
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n - Math.PI / 2;
      const lR = R + 30;
      const x = cx + lR * Math.cos(a);
      const y = cy + lR * Math.sin(a);
      ctx.font = 'bold 12px system-ui,sans-serif';
      ctx.fillStyle = '#2B6CB0';
      ctx.fillText(labels[i], x, y);
      ctx.font = '11px system-ui,sans-serif';
      ctx.fillStyle = '#4A5568';
      ctx.fillText(`${Math.round(values[i] * 100)}`, x, y + 15);
    }

    this.radarDrawn = true;
  }

  getTeamAxes(): TeamAxis[] {
    const analysis = this.analytics?.analysis;
    if (analysis?.radar_axes) {
      return Object.entries(analysis.radar_axes).map(([key, value]) => ({
        key,
        label: analysis.radar_labels?.[key] || this.formatAxisLabel(key),
        value: Number(value) || 0,
      }));
    }

    const prom = analysis?.promedios_equipo || {};
    return [
      { key: 'ofensiva', label: 'Ataque', value: Number(prom.ataques || 0) * 10 },
      { key: 'bloqueo', label: 'Bloqueo', value: Number(prom.bloqueos || 0) * 10 },
      { key: 'recepcion', label: 'Recepcion', value: Number(prom.recepciones || 0) * 10 },
      { key: 'control_errores', label: 'Control', value: Number(prom.eficiencia || 0) * 10 },
    ];
  }

  formatAxisLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  getAxisIcon(key: string): string {
    const map: Record<string, string> = {
      ofensiva: 'trending_up',
      recepcion: 'swap_vert',
      defensa: 'sports_handball',
      bloqueo: 'shield',
      saque: 'ads_click',
      armado: 'hub',
      control_errores: 'verified',
    };
    return map[key] || 'analytics';
  }

  getAxisFillClass(key: string): string {
    const map: Record<string, string> = {
      ofensiva: 'fill-ataques',
      recepcion: 'fill-recepciones',
      defensa: 'fill-defensa',
      bloqueo: 'fill-bloqueos',
      saque: 'fill-saque',
      armado: 'fill-armado',
      control_errores: 'fill-eficiencia',
    };
    return map[key] || 'fill-eficiencia';
  }

  getTendenciaIcon(): string {
    const t = this.analytics?.analysis?.tendencia;
    return t === 'mejorando' ? 'trending_up' : t === 'bajando' ? 'trending_down' : 'trending_flat';
  }

  getTendenciaClass(): string {
    const t = this.analytics?.analysis?.tendencia;
    return t === 'mejorando' ? 'tendencia-up' : t === 'bajando' ? 'tendencia-down' : 'tendencia-flat';
  }

  getNivelClass(): string {
    const m: Record<string, string> = {
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
    return m[this.analytics?.analysis?.nivel || ''] || '';
  }

  getOverallPercent(): number {
    return Math.round(this.getOverallDisplay());
  }

  getOverallDisplay(): number {
    const analysis = this.analytics?.analysis;
    return analysis?.overall_score_100 ?? ((analysis?.overall_score || 0) * 10);
  }

  getYearsActive(): string {
    if (!this.equipo?.ano_fundacion) return '';
    return (new Date().getFullYear() - this.equipo.ano_fundacion).toString();
  }

  getFotoUrl(fotoUrl: string | undefined | null): string {
    if (!fotoUrl) return '';
    if (fotoUrl.startsWith('http')) return fotoUrl;
    return `${this.baseUrl}${fotoUrl}`;
  }

  back(): void { this.router.navigate(['/ver-equipos-e']); }
  editar(): void { if (this.equipo?.id) this.router.navigate(['/editar-equipo', this.equipo.id]); }
  eliminar(): void {
    if (!this.equipo?.id || !confirm('¿Deseas eliminar este equipo?')) return;
    this.equipoService.eliminarEquipo(this.equipo.id).subscribe({
      next: () => { alert('Equipo eliminado correctamente'); this.back(); },
      error: () => { alert('Error al eliminar el equipo'); }
    });
  }
  logout(): void { this.authService.logOut(); this.router.navigate(['/login']); }
}
