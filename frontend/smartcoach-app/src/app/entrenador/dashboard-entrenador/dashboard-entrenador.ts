import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JugadorService } from '../../services/jugador/jugador-service';
import { EquipoService } from '../../services/equipo/equipo-service';
import { EntrenamientoService } from '../../services/entrenamiento/entrenamiento-service';
import { PartidoService } from '../../services/partido/partido-service';

@Component({
  selector: 'app-dashboard-entrenador',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard-entrenador.html',
  styleUrl: './dashboard-entrenador.css',
})
export class DashboardEntrenador implements OnInit {

  activePage: string = 'dashboard';
  activeTab: string = 'lista';
 
  // Data from API
  totalJugadores = 0;
  totalEquipos = 0;
  totalEntrenamientos = 0;
  totalPartidos = 0;
  promedioRendimiento = 0;
  jugadoresLesionados = 0;
  
  // Recent matches
  partidosRecientes: any[] = [];
  entrenamientosProximos: any[] = [];
  
  // Loading state
  loading = true;
  error = '';
 
  matchScore = { us: 3, them: 1 };
 
  players = [
    { name: 'Marco Rossi',  initials: 'MR', position: 'Colocador', team: 'Equipo A', number: 7,  status: 'Activo'    },
    { name: 'Liam Chen',    initials: 'LC', position: 'Atacante',  team: 'Equipo A', number: 11, status: 'Activo'    },
    { name: 'David Okafor', initials: 'DO', position: 'Central',   team: 'Equipo B', number: 3,  status: 'Lesionado' },
    { name: 'Ana García',   initials: 'AG', position: 'Líbero',    team: 'Equipo A', number: 2,  status: 'Activo'    },
    { name: 'Pedro Vega',   initials: 'PV', position: 'Central',   team: 'Equipo A', number: 5,  status: 'Activo'    },
  ];
 
  attendance = [
    { name: 'Marco Rossi',  position: 'Colocador', present: true  },
    { name: 'Liam Chen',    position: 'Atacante',  present: true  },
    { name: 'Ana García',   position: 'Líbero',    present: false },
    { name: 'Pedro Vega',   position: 'Central',   present: true  },
    { name: 'Luis Torres',  position: 'Atacante',  present: true  },
  ];
 
  ratingCategories = [
    { name: 'Saque',     value: 4 },
    { name: 'Ataque',    value: 5 },
    { name: 'Defensa',   value: 3 },
    { name: 'Recepción', value: 4 },
    { name: 'Bloqueo',   value: 3 },
    { name: 'Actitud',   value: 5 },
  ];
 
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
        // Count injured players
        this.jugadoresLesionados = jugadores.filter((j: any) => j.lesionado).length;
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
        // Get upcoming trainings (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        this.entrenamientosProximos = entrenamientos
          .filter((e: any) => {
            const fecha = new Date(e.fecha);
            return fecha >= today && fecha <= nextWeek;
          })
          .slice(0, 3)
          .map((e: any) => ({
            ...e,
            fecha_formatted: new Date(e.fecha).toLocaleDateString('es-ES', { 
              month: 'short', 
              day: 'numeric' 
            })
          }));
          
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
        
        // Get recent matches (last 5)
        const sortedPartidos = [...partidos].sort((a: any, b: any) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        
        this.partidosRecientes = sortedPartidos.slice(0, 5).map((p: any) => ({
          ...p,
          fecha_formatted: new Date(p.fecha).toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })
        }));
        
        // Calculate average performance (mock for now)
        this.promedioRendimiento = 8.2;
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partidos:', err);
        this.totalPartidos = 0;
        this.loading = false;
      }
    });
  }
 
  showPage(page: string): void {
    this.activePage = page;
    this.activeTab = 'lista';
  }


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
