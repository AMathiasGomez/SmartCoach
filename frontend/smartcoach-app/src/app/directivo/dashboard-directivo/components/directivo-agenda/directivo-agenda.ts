import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-directivo-agenda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-agenda.html',
})
export class DirectivoAgendaComponent {
  @Input() proximasActividades: any[] = [];
  @Input() actualizaciones: any[] = [];
}
