import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { ChartBar, Insight } from '../../dashboard-directivo';

@Component({
  selector: 'app-directivo-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-overview.html',
})
export class DirectivoOverviewComponent {
  @Input() saludInstitucional = 0;
  @Input() tendenciaClub: ChartBar[] = [];
  @Input() alertas: string[] = [];
  @Input() insights: Insight[] = [];
  @Input() mejorEquipo: any = null;
}
