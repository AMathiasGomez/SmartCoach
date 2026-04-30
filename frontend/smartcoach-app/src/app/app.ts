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

  constructor() {
    // Mobile menu toggle functionality
    this.initMobileMenu();
  }

  private initMobileMenu() {
    const hamburgerBtn = document.getElementById('mobile-menu-btn') as HTMLButtonElement;
    const sidebarOverlay = document.getElementById('sidebar-overlay') as HTMLDivElement;

    if (hamburgerBtn && sidebarOverlay) {
      hamburgerBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
        sidebarOverlay.classList.toggle('active');
      });

      sidebarOverlay.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
        sidebarOverlay.classList.remove('active');
      });
    }
  }
}
