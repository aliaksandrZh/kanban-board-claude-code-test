import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProjectsStore } from '../../core/stores/projects.store';
import type { Project } from '../../core/db/types';

@Component({
  selector: 'app-project-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (project(); as p) {
      <div class="project-shell">
        <header class="project-header">
          <h1 class="project-header__title">{{ p.name }}</h1>
          <p class="project-header__desc">{{ p.description }}</p>
          <nav class="tabs">
            <a
              class="tab"
              [routerLink]="['board']"
              routerLinkActive="tab--active"
              [routerLinkActiveOptions]="{ exact: true }"
            >Board</a>
            <a
              class="tab"
              [routerLink]="['wiki']"
              routerLinkActive="tab--active"
              [routerLinkActiveOptions]="{ exact: false }"
            >Wiki</a>
          </nav>
        </header>
        <div class="project-content">
          <router-outlet />
        </div>
      </div>
    } @else {
      <div class="not-found">Project not found.</div>
    }
  `,
  styles: `
    .project-shell {
      display: flex;
      flex-direction: column;
      height: calc(100dvh - 53px);
    }
    .project-header {
      padding: 1rem 1.5rem 0;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
    }
    .project-header__title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }
    .project-header__desc {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }
    .tabs {
      display: flex;
      gap: 1rem;
      margin-top: 0.75rem;
    }
    .tab {
      padding: 0.5rem 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      text-decoration: none;
      border-bottom: 2px solid transparent;
    }
    .tab--active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }
    .project-content {
      flex: 1;
      overflow: auto;
      padding: 1rem;
    }
    .not-found {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }
  `,
})
export class ProjectShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsStore = inject(ProjectsStore);

  readonly project = signal<Project | null>(null);

  ngOnInit(): void {
    this.loadProject();
  }

  private async loadProject(): Promise<void> {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (!projectId) {
      await this.router.navigate(['/projects']);
      return;
    }
    const p = await this.projectsStore.getProject(projectId);
    if (!p) {
      await this.router.navigate(['/projects']);
      return;
    }
    this.project.set(p);
  }
}
