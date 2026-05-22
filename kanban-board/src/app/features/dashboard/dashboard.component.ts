import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/stores/app.store';
import { ProjectsStore } from '../../core/stores/projects.store';
import { UsersStore } from '../../core/stores/users.store';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <section class="panel">
        <h2 class="panel__title">Projects</h2>
        <div class="panel__actions">
          <input
            class="input"
            type="text"
            placeholder="Project name"
            [value]="newProjectName()"
            (input)="newProjectName.set($any($event).target.value)"
          />
          <input
            class="input"
            type="text"
            placeholder="Description"
            [value]="newProjectDesc()"
            (input)="newProjectDesc.set($any($event).target.value)"
          />
          <button class="btn btn--primary" (click)="createProject()">Create Project</button>
        </div>
        <ul class="list">
          @for (project of projects(); track project.id) {
            <li class="list__item">
              <a class="list__link" [routerLink]="['/project', project.id, 'board']">{{ project.name }}</a>
              <span class="list__meta">{{ project.description }}</span>
              <button class="btn btn--danger btn--sm" (click)="deleteProject(project.id)">Delete</button>
            </li>
          } @empty {
            <li class="list__empty">No projects yet.</li>
          }
        </ul>
      </section>

      <section class="panel">
        <h2 class="panel__title">Users</h2>
        <div class="panel__actions">
          <input
            class="input"
            type="text"
            placeholder="Username"
            [value]="newUserName()"
            (input)="newUserName.set($any($event).target.value)"
          />
          <button class="btn btn--primary" (click)="createUser()">Create User</button>
        </div>
        <ul class="list">
          @for (user of users(); track user.id) {
            <li class="list__item">
              <span class="list__link">{{ user.name }}</span>
              @if (user.id !== currentUserId()) {
                <button class="btn btn--danger btn--sm" (click)="deleteUser(user.id)">Delete</button>
              }
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    .dashboard {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .panel__title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #111827;
    }
    .panel__actions {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .input {
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      min-width: 140px;
    }
    .btn {
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      background: #f3f4f6;
      color: #374151;
    }
    .btn--primary {
      background: #2563eb;
      color: #fff;
    }
    .btn--danger {
      background: #dc2626;
      color: #fff;
    }
    .btn--sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    .list {
      list-style: none;
    }
    .list__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .list__link {
      font-weight: 500;
      color: #111827;
      text-decoration: none;
      flex: 1;
    }
    .list__meta {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .list__empty {
      color: #9ca3af;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      .dashboard {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DashboardComponent {
  private readonly appStore = inject(AppStore);
  private readonly projectsStore = inject(ProjectsStore);
  private readonly usersStore = inject(UsersStore);

  readonly projects = computed(() => this.projectsStore.projects());
  readonly users = computed(() => this.usersStore.users());
  readonly currentUserId = computed(() => this.appStore.currentUserId());

  readonly newProjectName = signal('');
  readonly newProjectDesc = signal('');
  readonly newUserName = signal('');

  async createProject(): Promise<void> {
    const name = this.newProjectName().trim();
    const desc = this.newProjectDesc().trim();
    if (!name) return;
    await this.projectsStore.createProject(name, desc, this.appStore.currentUserId());
    this.newProjectName.set('');
    this.newProjectDesc.set('');
  }

  async deleteProject(id: string): Promise<void> {
    await this.projectsStore.deleteProject(id);
  }

  async createUser(): Promise<void> {
    const name = this.newUserName().trim();
    if (!name) return;
    await this.usersStore.createUser(name);
    this.newUserName.set('');
  }

  async deleteUser(id: string): Promise<void> {
    await this.usersStore.deleteUser(id);
  }
}
