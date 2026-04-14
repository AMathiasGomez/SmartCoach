export interface Entrenamiento {
  id?: number;
  fecha: string;
  hora: string;
  tipo: string;
  descripcion: string;
  duracion: number;
  estado: string;
  equipo_id: number;
}