import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private http: HttpClient) {}

  getUsuarios() {
    return this.http.get<any[]>('https://smartcoach-production.up.railway.app/api/usuarios');
  }

  updateRol(id: number, rol: string) {
return this.http.put(`https://smartcoach-production.up.railway.app/api/usuarios/${id}/rol`, { rol });
  }
  
}
