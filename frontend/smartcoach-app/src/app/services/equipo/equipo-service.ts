import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipo {
  id?: number;
  nombre: string;
  categoria: string;
  ano_fundacion: number;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EquipoService {

  private api = 'http://localhost:3006/api/equipos';

  constructor(private http: HttpClient) {}

  getEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.api);
  }

  crearEquipo(equipo: Equipo) {
    return this.http.post(this.api, equipo);
  }

  actualizarEquipo(id: number, equipo: Equipo) {
    return this.http.put(`${this.api}/${id}`, equipo);
  }

  eliminarEquipo(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
