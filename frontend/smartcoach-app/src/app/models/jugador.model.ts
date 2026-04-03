export interface Jugador {
  id?: number;
  nombre: string;
  fecha_nacimiento: string;
  posicion: string;
  numero: number;
  equipo_id: number;
  equipo_nombre?: string;
}