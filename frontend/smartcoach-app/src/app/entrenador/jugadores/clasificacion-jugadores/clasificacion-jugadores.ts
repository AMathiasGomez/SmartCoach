import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';

interface PlayerGeneral {
  player_id: string;
  name: string;
  posicion: string;
  nivel: 'Alto' | 'Medio' | 'Bajo';
  color: 'green' | 'yellow' | 'red';
  combined_score: number;
  cluster_id: number;
  breakdown: {
    score_historico: number;
    ataques_prom: number;
    bloqueos_prom: number;
    recepciones_prom: number;
    errores_prom: number;
    partidos: number;
  };
}

interface GeneralResult {
  team_id: string;
  team_name: string;
  classification: PlayerGeneral[];
  total_players: number;
  summary: {
    alto: number;
    medio: number;
    bajo: number;
    top_player: { player_id: string; name: string; nivel: string; combined_score: number } | null;
  };
}

interface Team {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-clasificacion-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clasificacion-jugadores.html',
  styleUrls: ['./clasificacion-jugadores.css'],
})
export class ClasificacionJugadores implements OnInit {
  teams: Team[] = [];
  selectedTeamId = '';
  loading = false;
  loadingTeams = false;
  error: string | null = null;
  result: GeneralResult | null = null;
  selectedPlayer: PlayerGeneral | null = null;
  filterNivel: 'Todos' | 'Alto' | 'Medio' | 'Bajo' = 'Todos';

  constructor(
    private http: HttpClient,
    public router: Router,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loadingTeams = true;
    this.error = null;

    this.http.get<any[]>(`${environment.apiUrl}/equipos`).subscribe({
      next: (res) => {
        this.teams = (res || []).map(e => ({ id: String(e.id), nombre: e.nombre }));
        this.loadingTeams = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error equipos:', err);
        this.error = 'Error al cargar los equipos.';
        this.loadingTeams = false;
        this.cd.detectChanges();
      }
    });
  }

  onTeamChange(): void {
    this.result = null;
    this.error = null;
    this.selectedPlayer = null;
    this.filterNivel = 'Todos';

    if (this.selectedTeamId) {
      this.loadClassification();
    }
  }

  loadClassification(): void {
    if (!this.selectedTeamId) return;

    this.loading = true;
    this.error = null;

    this.http.get<{ success?: boolean; data?: GeneralResult; error?: string } | GeneralResult>(
      `${environment.apiUrl}/analysis/classify-general?team_id=${this.selectedTeamId}`
    ).subscribe({
      next: (res) => {
        this.result = ('data' in res && res.data ? res.data : res) as GeneralResult;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error clasificacion:', err);
        this.error = err?.error?.error || 'Error al cargar la clasificacion.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  get filteredPlayers(): PlayerGeneral[] {
    const players = this.result?.classification || [];
    if (this.filterNivel === 'Todos') return players;
    return players.filter(p => p.nivel === this.filterNivel);
  }

  selectPlayer(player: PlayerGeneral): void {
    this.selectedPlayer = this.selectedPlayer?.player_id === player.player_id ? null : player;
  }

  setFilter(nivel: 'Todos' | 'Alto' | 'Medio' | 'Bajo'): void {
    this.filterNivel = nivel;
    this.selectedPlayer = null;
  }

  getNivelIcon(nivel: string): string {
    return { Alto: 'trending_up', Medio: 'remove', Bajo: 'trending_down' }[nivel] || 'remove';
  }

  getPositionAbbr(posicion: string): string {
    return {
      Opuesto: 'OP',
      Central: 'CE',
      Armador: 'AR',
      Punta: 'PT',
      Libero: 'LB'
    }[posicion] || (posicion || 'NA').slice(0, 2).toUpperCase();
  }

  getScoreWidth(score: number): string {
    const max = this.maxCombinedScore;
    return `${Math.min((score / max) * 100, 100)}%`;
  }

  get maxCombinedScore(): number {
    const players = this.result?.classification || [];
    return Math.max(...players.map(p => p.combined_score), 1);
  }

  get selectedTeamName(): string {
    return this.teams.find(t => t.id === this.selectedTeamId)?.nombre || '';
  }

  logout(): void {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
