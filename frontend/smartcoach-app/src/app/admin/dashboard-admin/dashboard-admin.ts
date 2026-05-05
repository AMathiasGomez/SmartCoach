import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { JugadorService } from '../../services/jugador/jugador-service';
import { EquipoService } from '../../services/equipo/equipo-service';
import { EntrenamientoService } from '../../services/entrenamiento/entrenamiento-service';
import { PartidoService } from '../../services/partido/partido-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {

  // Data from API
  totalJugadores = 0;
  totalEquipos = 0;
  totalEntrenamientos = 0;
  totalPartidos = 0;
  
  // Loading state
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    public router: Router,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private entrenamientoService: EntrenamientoService,
    private partidoService: PartidoService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    
    // Fetch total players
    this.jugadorService.getJugadores().subscribe({
      next: (jugadores) => {
        this.totalJugadores = jugadores.length;
        this.loadEquipos();
      },
      error: (err) => {
        console.error('Error loading jugadores:', err);
        this.totalJugadores = 0;
        this.loadEquipos();
      }
    });
  }

  loadEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: (equipos) => {
        this.totalEquipos = equipos.length;
        this.loadEntrenamientos();
      },
      error: (err) => {
        console.error('Error loading equipos:', err);
        this.totalEquipos = 0;
        this.loadEntrenamientos();
      }
    });
  }

  loadEntrenamientos() {
    this.entrenamientoService.getEntrenamientos().subscribe({
      next: (entrenamientos) => {
        this.totalEntrenamientos = entrenamientos.length;
        this.loadPartidos();
      },
      error: (err) => {
        console.error('Error loading entrenamientos:', err);
        this.totalEntrenamientos = 0;
        this.loadPartidos();
      }
    });
  }

  loadPartidos() {
    this.partidoService.getPartidos().subscribe({
      next: (partidos) => {
        this.totalPartidos = partidos.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partidos:', err);
        this.totalPartidos = 0;
        this.loading = false;
      }
    });
  }

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
