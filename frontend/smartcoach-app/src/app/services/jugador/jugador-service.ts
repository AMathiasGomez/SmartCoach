import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Jugador } from '../../models/jugador.model';

@Injectable({
  providedIn: 'root',
})
export class JugadorService {

  jugador: Jugador[] = [];

  private apiUrl = 'http://localhost:3006/api/jugadores';

  constructor(private http: HttpClient) {}

  getJugadores(): Observable<Jugador[]> {
      return this.http.get<Jugador[]>(this.apiUrl);
    }
  
    crearJugador(jugador: Jugador) {
      return this.http.post(this.apiUrl, jugador);
    }
  
    actualizarJugador(id: number, jugador: Jugador) {
      return this.http.put(`${this.apiUrl}/${id}`, jugador);
    }
  
    eliminarJugador(id: number) {
      return this.http.delete(`${this.apiUrl}/${id}`);
    }
  
    getJugador(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
}