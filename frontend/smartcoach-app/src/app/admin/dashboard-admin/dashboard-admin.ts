import { Component } from '@angular/core';
import { DashboardDirectivo } from "../../directivo/dashboard-directivo/dashboard-directivo";
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  selector: 'app-dashboard-admin',
  imports: [RouterLink],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin {

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}


  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
