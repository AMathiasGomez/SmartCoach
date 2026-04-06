import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PartidoService {

  private apiUrl = 'http://localhost:3006/api/partidos';

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

  updatePartido(id: number, data: any): Observable<any> {
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
    return this.http.get<any[]>(`http://localhost:3006/api/jugadores/equipo/${equipoId}`);
  }
}