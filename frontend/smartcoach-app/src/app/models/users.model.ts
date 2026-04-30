export type Rol = 'administrador' | 'entrenador' | 'directivo' | 'Usuario';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  fecha_registro: string;
  rol: Rol;
}