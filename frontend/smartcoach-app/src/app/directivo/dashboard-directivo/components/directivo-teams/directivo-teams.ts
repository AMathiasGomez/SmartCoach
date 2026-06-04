import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-directivo-teams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-teams.html',
})
export class DirectivoTeamsComponent implements OnChanges {
  @Input() equiposResumen: any[] = [];
  @Input() distribucionCategorias: any[] = [];

  equipoSeleccionado: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equiposResumen']) {
      this.equipoSeleccionado = this.equiposResumen[0] || null;
    }
  }

  seleccionarEquipo(equipo: any): void {
    this.equipoSeleccionado = equipo;
  }

  trackByEquipoId(_: number, equipo: any): number {
    return equipo.id;
  }
}
