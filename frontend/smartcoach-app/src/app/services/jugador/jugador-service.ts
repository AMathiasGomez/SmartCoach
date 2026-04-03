import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../equipo/equipo-service';

export interface Jugador {
  id?: number;
  nombre: string;
  fecha_nacimiento: string;
  posicion: string;
  numero: number;
  equipo_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class JugadorService {

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