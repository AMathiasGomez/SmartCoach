import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CrearJugador } from '../app/admin/jugador/crear-jugador/crear-jugador';
import { CrearEquipo } from '../app/admin/equipo/crear-equipo/crear-equipo';
import { VerEquipos } from '../app/admin/equipo/ver-equipos/ver-equipos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('smartcoach');
}
