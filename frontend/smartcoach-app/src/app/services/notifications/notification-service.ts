import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'success' | 'error' | 'warning';

export interface NotificationItem {
  id: number;
  message: string;
  tone: NotificationTone;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly notifications = signal<NotificationItem[]>([]);

  private nextId = 1;
  private installed = false;

  installAlertBridge(): void {
    if (this.installed || typeof window === 'undefined') {
      return;
    }

    const service = this;
    window.alert = function alertBridge(message?: unknown): void {
      service.fromAlert(message);
    };

    this.installed = true;
  }

  success(message: string, durationMs = 3600): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 4600): void {
    this.show(message, 'error', durationMs);
  }

  warning(message: string, durationMs = 4200): void {
    this.show(message, 'warning', durationMs);
  }

  dismiss(id: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  fromAlert(message: unknown): void {
    const normalized = this.normalizeMessage(message);
    this.show(normalized, this.inferTone(normalized));
  }

  private show(message: string, tone: NotificationTone, durationMs = 4000): void {
    const item: NotificationItem = {
      id: this.nextId++,
      message,
      tone,
    };

    this.notifications.update((items) => [...items, item]);
    window.setTimeout(() => this.dismiss(item.id), durationMs);
  }

  private normalizeMessage(message: unknown): string {
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }

    if (message == null) {
      return 'Notificacion';
    }

    return String(message).trim() || 'Notificacion';
  }

  private inferTone(message: string): NotificationTone {
    const value = message.toLowerCase();

    const errorPatterns = [
      'error',
      'incorrecta',
      'incorrecto',
      'fallo',
      'fallida',
      'fallido',
      'no se pudo',
      'no puedes',
      'backend',
    ];

    const warningPatterns = [
      'verifica',
      'primero',
      'carga',
      'no cumple',
      'advertencia',
      'pendiente',
      'atencion',
    ];

    const successPatterns = [
      'exitoso',
      'exitosamente',
      'correctamente',
      'actualizado',
      'actualizada',
      'creado',
      'creada',
      'eliminado',
      'eliminada',
      'guardadas',
      'guardado',
    ];

    if (errorPatterns.some((pattern) => value.includes(pattern))) {
      return 'error';
    }

    if (warningPatterns.some((pattern) => value.includes(pattern))) {
      return 'warning';
    }

    if (successPatterns.some((pattern) => value.includes(pattern))) {
      return 'success';
    }

    return 'warning';
  }
}
