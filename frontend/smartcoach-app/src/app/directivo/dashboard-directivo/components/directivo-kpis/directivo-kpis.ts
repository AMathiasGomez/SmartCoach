import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-directivo-kpis',
  standalone: true,
  templateUrl: './directivo-kpis.html',
})
export class DirectivoKpisComponent {
  @Input() totalJugadores = 0;
  @Input() totalEquipos = 0;
  @Input() totalPartidos = 0;
  @Input() partidosFinalizados = 0;
  @Input() totalEntrenamientos = 0;
  @Input() winRate = 0;
  @Input() promedioJugadoresPorEquipo = 0;
  @Input() coberturaEntrenamiento = 0;
}
