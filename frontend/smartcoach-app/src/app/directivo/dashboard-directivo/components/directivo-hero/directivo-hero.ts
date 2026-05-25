import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { DirectivoSection } from '../../dashboard-directivo';

@Component({
  selector: 'app-directivo-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-hero.html',
})
export class DirectivoHeroComponent {
  @Input() activeSection: DirectivoSection = 'resumen';
  @Input() saludInstitucional = 0;
  @Input() totalEquipos = 0;
  @Input() totalJugadores = 0;
  @Input() totalPartidos = 0;
  @Input() totalEntrenamientos = 0;
  @Input() totalReportes = 0;
  @Input() actividadesPendientes = 0;
  @Input() alertasAbiertas = 0;

  @Output() print = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  sectionLabels: Record<DirectivoSection, string> = {
    resumen: 'Resumen directivo',
    reportes: 'Reportes ejecutivos',
    equipos: 'Gestion de equipos',
    agenda: 'Agenda institucional',
  };

  sectionDescriptions: Record<DirectivoSection, string> = {
    resumen: 'Lectura ejecutiva para decidir rapido: estado del club, prioridades abiertas y rendimiento deportivo.',
    reportes: 'Informes listos para direccion, seguimiento deportivo y decisiones de gestion.',
    equipos: 'Vista institucional de plantillas, categorias y carga operativa por equipo.',
    agenda: 'Control de actividades futuras y movimientos recientes del club.',
  };

  sectionIcons: Record<DirectivoSection, string> = {
    resumen: 'query_stats',
    reportes: 'description',
    equipos: 'groups',
    agenda: 'event_available',
  };

  get heroMetrics() {
    const metrics: Record<DirectivoSection, { label: string; value: string | number }[]> = {
      resumen: [
        { label: 'Salud', value: `${this.saludInstitucional}%` },
        { label: 'Equipos', value: this.totalEquipos },
        { label: 'Alertas', value: this.alertasAbiertas },
      ],
      reportes: [
        { label: 'Informes', value: this.totalReportes },
        { label: 'Salud', value: `${this.saludInstitucional}%` },
        { label: 'Alertas', value: this.alertasAbiertas },
      ],
      equipos: [
        { label: 'Equipos', value: this.totalEquipos },
        { label: 'Jugadores', value: this.totalJugadores },
        { label: 'Sesiones', value: this.totalEntrenamientos },
      ],
      agenda: [
        { label: 'Pendientes', value: this.actividadesPendientes },
        { label: 'Partidos', value: this.totalPartidos },
        { label: 'Sesiones', value: this.totalEntrenamientos },
      ],
    };

    return metrics[this.activeSection];
  }
}
