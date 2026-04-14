import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-directivo',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-directivo.html',
  styleUrl: './dashboard-directivo.css',
})
export class DashboardDirectivo {

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
  
}
