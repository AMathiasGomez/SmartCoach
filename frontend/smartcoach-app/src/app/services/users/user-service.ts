import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient) {}

  getUsuarios() {
    return this.http.get<any[]>('http://localhost:3006/api/usuarios');
  }

  updateRol(id: number, rol: string) {
    return this.http.put(`http://localhost:3006/api/usuarios/${id}/rol`, { rol });
  }

}
