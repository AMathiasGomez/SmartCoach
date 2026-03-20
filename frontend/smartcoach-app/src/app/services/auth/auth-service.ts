import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private api = 'http://localhost:3006/api/auth'

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.api}/login`, data);
  }

  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    return JSON.parse(localStorage.getItem('user') || '{}')
  }

  logOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('user')
  }

  register(data: any) {
    return this.http.post(`${this.api}/register`, data)
  }

  getRol(): string | null {
    const token = localStorage.getItem('token');

    if (!token || token.split('.').length !== 3) {
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      return decoded.rol;
    } catch (error) {
      console.error('Token inválido');
      return null;
    }
  }
}
