// services/analytics/analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlayerAnalysis {
  player_id: string;
  name: string;
  position: string;
  score: number | null;
  category: 'Excelente' | 'Bueno' | 'Regular' | 'Malo' | 'Sin datos';
  label: string;
  color: 'green' | 'yellow' | 'red' | 'neutral';
  cluster_id: number | null;
  sin_estadisticas?: boolean;
  profile?: string;
  is_outlier?: boolean;
  outlier_score?: number;
  pca?: {
    pca_components: [number, number];
    explained_variance: {
      pc1: number;
      pc2: number;
    };
  };
  metrics?: Record<string, number>;
  metric_scores?: Record<string, number>;
  score_breakdown?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  interpretations?: string[];
  recommendations?: string[];
  comparisons?: {
    team_average_score: number;
    vs_team_average: 'por_encima' | 'similar' | 'por_debajo';
    best_match_score: number;
    best_position_score: number;
    vs_best_same_position: 'por_encima' | 'similar' | 'por_debajo';
  } | null;
  stats: {
    blocks: number;
    attacks: number;
    receptions: number;
    errors: number;
  };
}

export interface MatchAnalyticsSummary {
  team_average_score: number;
  top_player: PlayerAnalysis | null;
  categories: Record<string, number>;
}

export interface MatchAnalyticsResponse {
  match_id: string;
  total_players: number;
  analysis: PlayerAnalysis[];
  summary?: MatchAnalyticsSummary;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly API = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  analyzeMatch(matchId: number, players: any[]): Observable<MatchAnalyticsResponse> {
    return this.http.post<MatchAnalyticsResponse>(
      `${this.API}/partidos/${matchId}/analytics`,
      { players }
    );
  } 
}
