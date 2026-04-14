import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Entrenamiento } from '../../models/entrenamiento.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EntrenamientoService {

  entrenamiento: Entrenamiento[] = [];

  private apiUrl = 'http://localhost:3006/api/entrenamientos';

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

}
