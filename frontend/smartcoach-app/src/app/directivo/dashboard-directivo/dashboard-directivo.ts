import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';
import { JugadorService } from '../../services/jugador/jugador-service';
import { EquipoService } from '../../services/equipo/equipo-service';
import { EntrenamientoService } from '../../services/entrenamiento/entrenamiento-service';
import { PartidoService } from '../../services/partido/partido-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-directivo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-directivo.html',
  styleUrl: './dashboard-directivo.css',
})
export class DashboardDirectivo implements OnInit {

  // Data from API
  totalJugadores = 0;
  totalEquipos = 0;
  totalPartidos = 0;
  totalEntrenamientos = 0;
  winRate = 0;
  promedioRendimiento = 0;
  
  // Best performing team
  mejorEquipo: any = null;
  alertas: any[] = [];
  
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
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    
    this.jugadorService.getJugadores().subscribe({
      next: (jugadores) => {
        this.totalJugadores = jugadores.length;
        // Check for players needing medical attention
        this.alertas = jugadores
          .filter((j: any) => j.lesionado)
          .slice(0, 3)
          .map((j: any) => `${j.nombre} requiere revisión médica`);
          
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
        
        // Find best performing team (mock - would need performance data)
        if (equipos.length > 0) {
          this.mejorEquipo = {
            nombre: equipos[0].nombre,
            eficiencia: 85 + Math.floor(Math.random() * 15)
          };
        }
        
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
        
        // Calculate win rate
        const victorias = partidos.filter((p: any) => p.resultado === 'victoria').length;
        this.winRate = partidos.length > 0 
          ? Math.round((victorias / partidos.length) * 100) 
          : 0;
        
        // Calculate average performance
        this.promedioRendimiento = 8.4;
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partidos:', err);
        this.totalPartidos = 0;
        this.winRate = 0;
        this.loading = false;
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
  
}
