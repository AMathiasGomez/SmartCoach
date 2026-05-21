import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Entrenamiento } from '../../models/entrenamiento.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EntrenamientoService {

  entrenamiento: Entrenamiento[] = [];

  private apiUrl = `${environment.apiUrl}/entrenamientos`;
  private comentariosUrl = `${environment.apiUrl}/comentarios`;

  constructor(private http: HttpClient) {}

  crearEntrenamiento(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  getEntrenamientos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  deleteEntrenamiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getEntrenamiento(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateEntrenamiento(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  saveAsistencia(entrenamientoId: number, asistencias: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${entrenamientoId}/asistencia`, { asistencias });
  }

  // ── Comentarios ─────────────────────────────────────────────────────────────

  getComentarios(entrenamientoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.comentariosUrl}?entrenamiento_id=${entrenamientoId}`);
  }

  crearComentario(payload: { contenido: string; fecha: string; usuarios_id: number; entrenamiento_id: number }): Observable<any> {
    return this.http.post(this.comentariosUrl, payload);
  }

  eliminarComentario(id: number): Observable<any> {
    return this.http.delete(`${this.comentariosUrl}/${id}`);
  }
}
