import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-entrenador',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-entrenador.html',
  styleUrl: './dashboard-entrenador.css',
})
export class DashboardEntrenador {

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
