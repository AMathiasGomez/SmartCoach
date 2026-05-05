import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PartidoService {

  private apiUrl = `${environment.apiUrl}/partidos`;

  constructor(private http: HttpClient) { }

  createPartido(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getPartidos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getPartidoById(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updatePartido(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deletePartido(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getSets(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/sets`);
  }

  updateEstado(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/estado`, { estado });
  }

  addSet(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/sets`, data);
  }

  getEstadisticas(partidoId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/${partidoId}/estadisticas`);
  }

  addEstadisticas(id: number, data: any) {
    return this.http.post(`${this.apiUrl}/${id}/estadisticas`, data);
  }

  getJugadoresByEquipo(equipoId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/jugadores/equipo/${equipoId}`);
  }

  getJugadoresByPartido(partidoId: number): Observable<any[]> {
    const url = `${this.apiUrl}/${partidoId}/jugadores`;
    console.log('URL FINAL:', url);
    return this.http.get<any[]>(url);
  }

  addEstadisticasPorSet(partidoId: number, setId: number, stats: any): Observable<any> {
    const url = `${this.apiUrl}/${partidoId}/sets/${setId}/estadisticas`;
    return this.http.post(url, stats);
  }

  getEstadisticasPorSets(partidoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${partidoId}/estadisticas-sets`);
  }

  getEstadisticasJugador(jugadorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/jugador/${jugadorId}/estadisticas`);
  }

  saveAnalytics(partidoId: number, analysis: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${partidoId}/analytics/save`, { analysis });
  }

  getAnalytics(partidoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${partidoId}/analytics`);
  }
}
