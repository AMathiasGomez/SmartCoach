import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-entrenador',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard-entrenador.html',
  styleUrl: './dashboard-entrenador.css',
})
export class DashboardEntrenador {

  activePage: string = 'dashboard';
  activeTab: string = 'lista';
 
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
 
  showPage(page: string): void {
    this.activePage = page;
    this.activeTab = 'lista';
  }

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
