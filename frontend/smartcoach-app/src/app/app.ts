import { Component, OnInit, signal } from '@angular/core';
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
export class App implements OnInit {
  protected readonly title = signal('smartcoach');
  isDarkMode = false;

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('smartcoach-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    this.isDarkMode = savedTheme ? savedTheme === 'dark' : !!prefersDark;
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('smartcoach-theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }
}
