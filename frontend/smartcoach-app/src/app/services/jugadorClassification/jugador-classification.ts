import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JugadorClassification {
   
  private readonly endpoint = `${environment.apiUrl}/api/analysis/classify-performance`;
 
  constructor(private http: HttpClient) {}
 
  classify(matchAnalysis: any, teamAnalysis: any): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(this.endpoint, {
      match_analysis: matchAnalysis,
      team_analysis: teamAnalysis
    });
  }
}
