import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from './core/auth.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  // The sidebar is chrome for the signed-in app; the login page gets its own full-page layout.
  isLoginPage = signal(false);

  constructor(public authService: AuthService, private router: Router) {
    this.isLoginPage.set(this.router.url.startsWith('/login'));
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.isLoginPage.set((e as NavigationEnd).urlAfterRedirects.startsWith('/login'));
    });
  }
}
