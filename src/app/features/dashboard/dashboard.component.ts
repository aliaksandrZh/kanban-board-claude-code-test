import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '../../core/projects.service';
import { UsersService } from '../../core/users.service';
import { AppStore } from '../../stores/app.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dashboard">
      <section class="panel">
        <h2>Projects</h2>
        <div class="create-row">
          <input
            type="text"
            placeholder="Project name"
            [(ngModel)]="newProjectName"
            (keyup.enter)="createProject()"
          />
          <input
            type="text"
            placeholder="Description"
            [(ngModel)]="newProjectDesc"
            (keyup.enter)="createProject()"
          />
          <button (click)="createProject()">Create Project</button>
        </div>
        <div class="list">
          @for (project of projectsService.projects(); track project.id) {
            <div class="list-item">
              <a [routerLink]="['/project', project.id]" class="item-name">
                {{ project.name }}
              </a>
              <span class="item-meta">{{ project.description }}</span>
              <button class="btn-small" (click)="deleteProject(project.id)">Delete</button>
            </div>
          } @empty {
            <p class="empty">No projects yet.</p>
          }
        </div>
      </section>

      <section class="panel">
        <h2>Users</h2>
        <div class="list">
          @for (user of usersService.users(); track user.id) {
            <div class="list-item">
              <span class="item-name">{{ user.name }}</span>
              <span class="item-meta">{{ user.createdAt | date: 'short' }}</span>
              @if (user.id !== 'root') {
                <button class="btn-small" (click)="deleteUser(user.id)">Delete</button>
              }
            </div>
          } @empty {
            <p class="empty">No users yet.</p>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .dashboard {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    h2 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }
    .create-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }
      button {
        padding: 0.5rem 1rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        font-weight: 500;
        &:hover {
          background: #1d4ed8;
        }
      }
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .list-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid #f3f4f6;
      border-radius: 0.375rem;
      background: #f9fafb;
    }
    .item-name {
      font-weight: 500;
      color: #111827;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
    .item-meta {
      color: #6b7280;
      font-size: 0.875rem;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn-small {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border: 1px solid #d1d5db;
      background: #fff;
      border-radius: 0.25rem;
      cursor: pointer;
      &:hover {
        background: #fee2e2;
        border-color: #ef4444;
        color: #b91c1c;
      }
    }
    .empty {
      color: #9ca3af;
      font-size: 0.875rem;
    }
  `,
})
export class DashboardComponent {
  projectsService = inject(ProjectsService);
  usersService = inject(UsersService);
  appStore = inject(AppStore);

  newProjectName = '';
  newProjectDesc = '';

  constructor() {
    this.projectsService.loadProjects();
  }

  async createProject(): Promise<void> {
    const name = this.newProjectName.trim();
    if (!name) return;
    const userId = this.appStore.currentUserId();
    if (!userId) {
      alert('Please select a user first.');
      return;
    }
    await this.projectsService.createProject(
      name,
      this.newProjectDesc.trim(),
      userId
    );
    this.newProjectName = '';
    this.newProjectDesc = '';
  }

  async deleteProject(id: string): Promise<void> {
    if (!confirm('Delete this project?')) return;
    await this.projectsService.deleteProject(id);
  }

  async deleteUser(id: string): Promise<void> {
    if (!confirm('Delete this user?')) return;
    await this.usersService.deleteUser(id);
  }
}
