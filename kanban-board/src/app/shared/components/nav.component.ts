import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/stores/app.store';
import { UsersStore } from '../../core/stores/users.store';

@Component({
  selector: 'app-nav',
  imports: [RouterLink],
  template: `
    <nav class="nav">
      <a class="nav__logo" routerLink="/projects">Kanban</a>
      <div class="nav__links">
        <a class="nav__link" routerLink="/projects">Dashboard</a>
        <div class="nav__user">
          <select
            class="nav__select"
            [value]="currentUserId()"
            (change)="onUserChange($event)"
            aria-label="Current user"
          >
            @for (user of users(); track user.id) {
              <option [value]="user.id">{{ user.name }}</option>
            }
          </select>
        </div>
      </div>
    </nav>
  `,
  styles: `
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      gap: 1rem;
    }
    .nav__logo {
      font-weight: 700;
      font-size: 1.25rem;
      color: #111827;
      text-decoration: none;
    }
    .nav__links {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .nav__link {
      color: #374151;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .nav__link:hover {
      color: #111827;
    }
    .nav__select {
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: #fff;
    }
  `,
})
export class NavComponent {
  private readonly appStore = inject(AppStore);
  private readonly usersStore = inject(UsersStore);

  readonly users = computed(() => this.usersStore.users());
  readonly currentUserId = computed(() => this.appStore.currentUser()?.id ?? '');

  onUserChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const user = this.users().find(u => u.id === id);
    if (user) {
      this.appStore.setCurrentUser(user);
    }
  }
}
