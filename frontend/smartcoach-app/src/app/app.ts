import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CrearJugador } from '../admin/crear-jugador/crear-jugador';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth-interceptor';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CrearJugador],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('smartcoach');
}
