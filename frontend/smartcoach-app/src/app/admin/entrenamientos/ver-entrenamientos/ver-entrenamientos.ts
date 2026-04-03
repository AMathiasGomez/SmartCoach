import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-ver-entrenamientos',
  imports: [RouterLink],
  templateUrl: './ver-entrenamientos.html',
  styleUrl: './ver-entrenamientos.css',
})
export class VerEntrenamientos {

  constructor(
    private authService: AuthService,
    public router: Router,
  ) { }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
