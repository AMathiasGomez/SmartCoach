import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Jugador } from '../../models/jugador.model';

@Injectable({
  providedIn: 'root',
})
export class JugadorService {

  jugador: Jugador[] = [];

  private apiUrl = 'https://smartcoach-production.up.railway.app/api/jugadores';

  constructor(private http: HttpClient) { }

  getJugadores(): Observable<Jugador[]> {
    return this.http.get<Jugador[]>(this.apiUrl);
  }

  crearJugador(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}`, formData, {
      headers: { 'Accept': 'application/json' }
    });
  }

  actualizarJugador(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData, {
      headers: { 'Accept': 'application/json' }
    });
  }

  eliminarJugador(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getJugador(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  actualizarJugadorJson(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  getJugadoresByEquipo(equipoId: number): Observable<Jugador[]> {
    return this.http.get<Jugador[]>(`${this.apiUrl}/equipo/${equipoId}`);
  }
}