import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UsersService } from './core/users.service';
import { AppStore } from './stores/app.store';
import { UserSelectorComponent } from './features/users/user-selector.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, UserSelectorComponent],
  template: `
    <div class="app-layout">
      <header class="app-header">
        <a routerLink="/" class="logo">Kanban</a>
        <nav class="main-nav">
          <a routerLink="/">Dashboard</a>
        </nav>
        <app-user-selector />
      </header>
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .app-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
    }
    .main-nav {
      flex: 1;
      a {
        color: #374151;
        text-decoration: none;
        font-weight: 500;
        &:hover {
          color: #111827;
        }
      }
    }
    .app-main {
      flex: 1;
      overflow: auto;
      background: #f3f4f6;
    }
  `,
})
export class App implements OnInit {
  private usersService = inject(UsersService);
  readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.usersService.loadUsers();
  }
}
