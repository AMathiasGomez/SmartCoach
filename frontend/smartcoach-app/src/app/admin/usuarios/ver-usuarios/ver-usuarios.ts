import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/users/user-service';
import { AuthService } from '../../../services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, Rol } from '../../../models/users.model';

@Component({
  selector: 'app-ver-usuarios',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './ver-usuarios.html',
  styleUrls: ['./ver-usuarios.css'],
})
export class VerUsuarios implements OnInit {

  usuarios: (Usuario & { cargando?: boolean })[] = [];
  usuariosFiltrados: (Usuario & { cargando?: boolean })[] = [];

  cargando = false;
  error = '';

  filtroUsuario = '';
  filtroRol = '';

  constructor(
    private usuarioService: UserService,
    private authService: AuthService,
    public router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {

    this.cargando = true;

    this.usuarioService.getUsuarios().subscribe({

      next: (data) => {

        this.usuarios = data;
        this.usuariosFiltrados = data;

        this.cargando = false;

        this.cd.detectChanges();
      },

      error: () => {

        this.error = 'Error al cargar usuarios';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {

    const usuario = this.filtroUsuario.toLowerCase().trim();
    const rol = this.filtroRol;

    this.usuariosFiltrados = this.usuarios.filter(u => {

      const matchUsuario =
        !usuario ||
        u.nombre?.toLowerCase().includes(usuario);

      const matchRol =
        !rol ||
        u.rol === rol;

      return matchUsuario && matchRol;
    });
  }

  limpiarFiltros() {

    this.filtroUsuario = '';
    this.filtroRol = '';

    this.usuariosFiltrados = [...this.usuarios];
  }

  hayFiltrosActivos(): boolean {

    return !!(
      this.filtroUsuario ||
      this.filtroRol
    );
  }

  cambiarRol(id: number, event: Event): void {

    const select = event.target as HTMLSelectElement;
    const valor = select.value as Rol;

    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) return;

    if (usuario.rol === valor) return;

    const confirmar = confirm(
      `¿Seguro que deseas cambiar el rol de "${usuario.nombre}" a "${valor}"?`
    );

    if (!confirmar) {
      select.value = usuario.rol;
      return;
    }

    usuario.cargando = true;

    this.usuarioService.updateRol(id, valor).subscribe({

      next: () => {

        usuario.rol = valor;
        usuario.cargando = false;

        this.cd.detectChanges();
      },

      error: () => {

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