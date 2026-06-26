import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth/auth-service';
import { NotificationService } from './services/notifications/notification-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('smartcoach');
  isDarkMode = false;
  sessionUser: any = null;
  showSidebarSession = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('smartcoach-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    this.isDarkMode = savedTheme ? savedTheme === 'dark' : !!prefersDark;
    this.applyTheme();
    this.syncSessionState();
    this.notificationService.installAlertBridge();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncSessionState());
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('smartcoach-theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  logout(): void {
    this.authService.logOut();
    this.syncSessionState();
    this.router.navigate(['/login']);
  }

  get sessionName(): string {
    return this.sessionUser?.nombre || this.sessionUser?.name || 'Usuario';
  }

  get sessionDetail(): string {
    const role = this.sessionUser?.rol || 'sesion activa';
    return String(role).charAt(0).toUpperCase() + String(role).slice(1);
  }

  get sessionInitials(): string {
    const source = this.sessionName.trim();
    if (!source) return 'SC';

    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private syncSessionState(): void {
    this.sessionUser = this.authService.getUser();
    const currentUrl = this.router.url;
    const isAuthRoute = currentUrl.startsWith('/login') || currentUrl.startsWith('/register') || currentUrl === '/';

    this.showSidebarSession = !!this.sessionUser?.rol && !isAuthRoute;
  }
}
