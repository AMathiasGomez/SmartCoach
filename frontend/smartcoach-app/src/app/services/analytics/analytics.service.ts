// services/analytics/analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlayerAnalysis {
  player_id: string;
  name: string;
  score: number;
  label: string;
  color: 'green' | 'yellow' | 'red';
  cluster_id: number;
  is_outlier: boolean;
  outlier_score: number;
  pca: {
    pca_components: [number, number];
    explained_variance: {
      pc1: number;
      pc2: number;
    };
  };
  stats: {
    blocks: number;
    attacks: number;
    receptions: number;
    errors: number;
  };
}

export interface MatchAnalyticsResponse {
  match_id: string;
  total_players: number;
  analysis: PlayerAnalysis[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly API = '/api';

  constructor(private http: HttpClient) {}

  analyzeMatch(matchId: number, players: any[]): Observable<MatchAnalyticsResponse> {
    return this.http.post<MatchAnalyticsResponse>(
      `${this.API}/matches/${matchId}/analytics`,
      { players }
    );
  }
}