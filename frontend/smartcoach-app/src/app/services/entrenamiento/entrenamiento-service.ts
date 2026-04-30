import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Entrenamiento } from '../../models/entrenamiento.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EntrenamientoService {

  entrenamiento: Entrenamiento[] = [];

  private apiUrl = 'http://smartcoach-production.up.railway.app/api/entrenamientos';

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

  saveAsistencia(entrenamientoId: number, asistencias: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${entrenamientoId}/asistencia`, { asistencias });
  }

}
