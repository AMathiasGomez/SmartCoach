import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorService } from '../../../services/jugador/jugador-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';
import { EquipoService } from '../../../services/equipo/equipo-service';

@Component({
  selector: 'app-editar-jugador',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './editar-jugador.html',
  styleUrls: ['./editar-jugador.css']
})
export class EditarJugador implements OnInit {

  id!: number;

  jugador = {
    nombre: '',
    fecha_nacimiento: '',
    posicion: '',
    numero: 0,
    equipo_id: 0
  };

  equipos: any[] = [];

  cargando = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private jugadorService: JugadorService,
    private equipoService: EquipoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

    if (!this.id) {
      console.error('ID no válido');
      this.router.navigate(['/ver-jugadores']);
      return;
    }

    this.obtenerJugador();
    this.obtenerEquipos();
  }

  obtenerJugador() {
    this.jugadorService.getJugador(this.id).subscribe({
      next: (res: any) => {

        console.log('✅ jugador:', res);
        
        this.jugador = res;
        
        this.cd.detectChanges();

        this.cargando = false;
      },
      error: (err: any) => {
        console.error('❌ error:', err);
        this.router.navigate(['/ver-jugadores']);
      }
    });
  }

  obtenerEquipos() {
    this.equipoService.getEquipos().subscribe({
      next: (res: any) => {
        this.equipos = res;
      },
      error: (err: any) => {
        console.error('Error cargando equipos', err);
      }
    });
  }

  actualizarJugador() {

    if (!this.jugador.nombre || !this.jugador.posicion || !this.jugador.numero || !this.jugador.equipo_id) {
      console.error('Campos obligatorios');
      return;
    }

    this.jugadorService.actualizarJugador(this.id, this.jugador).subscribe({
      next: () => {
        alert('Jugador actualizado correctamente');
        this.router.navigate(['/ver-jugadores']);
      },
      error: (err: any) => {
        console.error('Error al actualizar jugador', err);
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}