import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/users/user-service';
import { AuthService } from '../../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Usuario, Rol } from '../../../models/users.model';

@Component({
  selector: 'app-ver-usuarios',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './ver-usuarios.html',
  styleUrls: ['./ver-usuarios.css'],
})
export class VerUsuarios implements OnInit {

  usuarios: (Usuario & { cargando?: boolean })[] = [];
  cargando = false;
  error = '';

  constructor(
    private usuarioService: UserService,
    private authService: AuthService,
    public router: Router,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
        console.log('USUARIOS', data);

        this.cd.detectChanges();

      },
      error: () => {
        this.error = 'Error al cargar usuarios';
        this.cargando = false;
      }
    });
  }

  cambiarRol(id: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const valor = select.value as Rol;

    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) return;

    if (usuario.rol === valor) return;

    const confirmar = confirm(`¿Seguro que deseas cambiar el rol de "${usuario.nombre}" a "${valor}"? Ten en cuenta que esto puede afectar los permisos de este usuario en el sistema.`);

    if (!confirmar) {
      select.value = usuario.rol;
      return;
    }

    usuario.cargando = false;

    this.usuarioService.updateRol(id, valor).subscribe({
      next: () => {
        usuario.rol = valor;
        usuario.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar el rol');
        usuario.cargando = false;

        select.value = usuario.rol;
      }
    });
  }

  logout() {
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
