import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

type DirectivoSection = 'resumen' | 'reportes' | 'equipos' | 'agenda';

@Component({
  selector: 'app-directivo-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directivo-sidebar.html',
})
export class DirectivoSidebarComponent {
  @Input() open = false;
  @Input() activeSection: DirectivoSection = 'resumen';

  @Output() close = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() sectionChange = new EventEmitter<DirectivoSection>();
}
