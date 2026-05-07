import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { Equipo } from '../../../models/equipo.model';
import { Jugador } from '../../../models/jugador.model';
import { AuthService } from '../../../services/auth/auth-service';
import { forkJoin } from 'rxjs';
 
@Component({
  selector: 'app-detalle-equipo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-equipo.html',
  styleUrl: './detalle-equipo.css'
})
export class DetalleEquipo implements OnInit, AfterViewInit {
  @ViewChild('radarCanvasEquipo') radarCanvasRef!: ElementRef<HTMLCanvasElement>;
 
  equipo: Equipo | null = null;
  jugadores: Jugador[] = [];
  loading = false;
  error = '';
 
  // Analytics
  analytics: any = null;
  analyticsLoading = false;
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipoService: EquipoService,
    private jugadorService: JugadorService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void { this.loadEquipo(); }
  ngAfterViewInit(): void {}
 
  loadEquipo(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ID de equipo no válido'; return; }
 
    this.loading = true;
    forkJoin({
      equipo:    this.equipoService.getEquipo(id),
      jugadores: this.jugadorService.getJugadoresByEquipo(id)
    }).subscribe({
      next: ({ equipo, jugadores }) => {
        this.equipo    = equipo as Equipo;
        this.jugadores = jugadores;
        this.loading   = false;
        this.loadAnalytics(id);
        this.cd.detectChanges();
      },
      error: () => { this.error = 'Error al cargar el equipo'; this.loading = false; }
    });
  }
 
  loadAnalytics(equipoId: number): void {
    this.analyticsLoading = true;
    this.equipoService.getTeamAnalytics(equipoId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.analyticsLoading = false;
        this.cd.detectChanges();
        setTimeout(() => this.drawRadar(), 120);
      },
      error: () => { this.analytics = null; this.analyticsLoading = false; }
    });
  }
 
  // ─── Radar Chart ──────────────────────────────────────────────────────────
  drawRadar(): void {
    if (!this.radarCanvasRef || !this.analytics?.analysis) return;
    const canvas = this.radarCanvasRef.nativeElement;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;
 
    const prom   = this.analytics.analysis.promedios_equipo;
    const labels = ['Ataques', 'Bloqueos', 'Recepciones', 'Eficiencia'];
    const values = [
      Math.min(prom.ataques     / 10, 1),
      Math.min(prom.bloqueos    / 10, 1),
      Math.min(prom.recepciones / 10, 1),
      Math.min(prom.eficiencia  / 10, 1),
    ];
 
    const sz = canvas.width, cx = sz/2, cy = sz/2, R = sz*0.36, n = labels.length;
    ctx.clearRect(0, 0, sz, sz);
 
    // Círculos de fondo
    for (let lv = 1; lv <= 5; lv++) {
      const r = R * lv / 5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = Math.PI*2*i/n - Math.PI/2;
        i===0 ? ctx.moveTo(cx+r*Math.cos(a), cy+r*Math.sin(a))
              : ctx.lineTo(cx+r*Math.cos(a), cy+r*Math.sin(a));
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(49,130,206,0.20)'; ctx.lineWidth = 1; ctx.stroke();
    }
 
    // Ejes
    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.lineTo(cx+R*Math.cos(a), cy+R*Math.sin(a));
      ctx.strokeStyle='rgba(49,130,206,0.30)'; ctx.lineWidth=1; ctx.stroke();
    }
 
    // Polígono datos
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2;
      const r = R * Math.max(0, values[i]);
      i===0 ? ctx.moveTo(cx+r*Math.cos(a), cy+r*Math.sin(a))
            : ctx.lineTo(cx+r*Math.cos(a), cy+r*Math.sin(a));
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    g.addColorStop(0,'rgba(49,130,206,0.55)'); g.addColorStop(1,'rgba(49,130,206,0.15)');
    ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='#3182CE'; ctx.lineWidth=2.5; ctx.stroke();
 
    // Puntos
    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2;
      const r = R * Math.max(0, values[i]);
      ctx.beginPath(); ctx.arc(cx+r*Math.cos(a), cy+r*Math.sin(a), 4, 0, Math.PI*2);
      ctx.fillStyle='#63B3ED'; ctx.fill();
    }
 
    // Etiquetas
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for (let i = 0; i < n; i++) {
      const a = Math.PI*2*i/n - Math.PI/2;
      const lR = R + 40;
      const x = cx+lR*Math.cos(a), y = cy+lR*Math.sin(a);
      ctx.font='bold 13px system-ui,sans-serif'; ctx.fillStyle='#2B6CB0';
      ctx.fillText(labels[i], x, y);
      ctx.font='11px system-ui,sans-serif'; ctx.fillStyle='#4A5568';
      ctx.fillText(`${(values[i]*10).toFixed(1)}`, x, y+15);
    }
  }
 
  // ─── Helpers template ────────────────────────────────────────────────────
  getTendenciaIcon():  string {
    const t = this.analytics?.analysis?.tendencia;
    return t==='mejorando' ? 'trending_up' : t==='bajando' ? 'trending_down' : 'trending_flat';
  }
  getTendenciaClass(): string {
    const t = this.analytics?.analysis?.tendencia;
    return t==='mejorando' ? 'tendencia-up' : t==='bajando' ? 'tendencia-down' : 'tendencia-flat';
  }
  getNivelClass(): string {
    const m: Record<string,string> = {
      'Élite':'nivel-elite','Alto':'nivel-alto','Medio':'nivel-medio','Bajo':'nivel-bajo','Inicial':'nivel-inicial'
    };
    return m[this.analytics?.analysis?.nivel||'']||'';
  }
  getOverallPercent(): number {
    return Math.round((this.analytics?.analysis?.overall_score||0)*10);
  }
 
  // ─── Métodos existentes ───────────────────────────────────────────────────
  getYearsActive(): string {
    if (!this.equipo?.ano_fundacion) return '';
    return (new Date().getFullYear() - this.equipo.ano_fundacion).toString();
  }
  back():   void { this.router.navigate(['/ver-equipos-e']); }
  editar(): void { if (this.equipo?.id) this.router.navigate(['/editar-equipo', this.equipo.id]); }
  eliminar(): void {
    if (!this.equipo?.id || !confirm('¿Deseas eliminar este equipo?')) return;
    this.equipoService.eliminarEquipo(this.equipo.id).subscribe({
      next:  () => { alert('Equipo eliminado correctamente'); this.back(); },
      error: () => { alert('Error al eliminar el equipo'); }
    });
  }
  logout(): void { this.authService.logOut(); this.router.navigate(['/login']); }
}