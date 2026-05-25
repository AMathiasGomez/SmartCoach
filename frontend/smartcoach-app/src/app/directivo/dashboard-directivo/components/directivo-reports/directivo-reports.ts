import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { ExecutiveReport } from '../../dashboard-directivo';

@Component({
  selector: 'app-directivo-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-reports.html',
})
export class DirectivoReportsComponent {
  @Input() reportes: ExecutiveReport[] = [];

  @Output() download = new EventEmitter<ExecutiveReport | undefined>();

  getReportClass(status: ExecutiveReport['status']) {
    return {
      'status-ready': status === 'Listo',
      'status-watch': status === 'En observacion',
      'status-risk': status === 'Requiere seguimiento',
    };
  }
}
