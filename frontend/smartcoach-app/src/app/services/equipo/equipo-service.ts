import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipo } from '../../models/equipo.model';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  equipo: Equipo[] = [];

  private api = 'http://localhost:3006/api/equipos';

  constructor(private http: HttpClient) {}

  getEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.api);
  }

  crearEquipo(data: any) {
    return this.http.post(`${this.api}`, data);
  }

  actualizarEquipo(id: number, equipo: Equipo) {
    return this.http.put(`${this.api}/${id}`, equipo);
  }

  eliminarEquipo(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getEquipo(id: number) {
    return this.http.get(`${this.api}/${id}`);
  }
}