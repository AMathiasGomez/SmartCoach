import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipoService } from '../../../services/equipo/equipo-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-editar-equipo',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './editar-equipo.html',
  styleUrls: ['./editar-equipo.css']
})
export class EditarEquipo implements OnInit {

  id!: number;

  equipo = {
    nombre: '',
    categoria: '',
    ano_fundacion: 0,
    descripcion: ''
  };

  cargando = true;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private equipoService: EquipoService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

    if (!this.id) {
      console.error('ID no válido');
      this.router.navigate(['/ver-equipos']);
      return;
    }

    this.obtenerEquipo();
  }

  obtenerEquipo() {
  this.equipoService.getEquipo(this.id).subscribe({
    next: (res: any) => {

      console.log('✅ respuesta:', res);

      this.equipo = res[0];

      this.cd.detectChanges();

      console.log('✅ equipo asignado:', this.equipo);

      this.cargando = false;

      console.log('✅ cargando en false');

    },
      error: (err: any) => {
        console.error('❌ error:', err);
        this.router.navigate(['/ver-equipos']);
      }
    });
  }

  actualizarEquipo() {

    if (!this.equipo.nombre || !this.equipo.categoria) {
      console.error('Campos obligatorios');
      return;
    }

    this.equipoService.actualizarEquipo(this.id, this.equipo).subscribe({
      next: () => {
        console.log('Equipo actualizado correctamente');
        this.router.navigate(['/equipos']);
      },
      error: (err: any) => {
        console.error('Error al actualizar equipo', err);
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}