import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-directivo-teams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-teams.html',
})
export class DirectivoTeamsComponent {
  @Input() equiposResumen: any[] = [];
  @Input() distribucionCategorias: any[] = [];
}
