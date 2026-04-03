import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-usuario',
  imports: [],
  templateUrl: './dashboard-usuario.html',
  styleUrl: './dashboard-usuario.css',
})
export class DashboardUsuario {

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
