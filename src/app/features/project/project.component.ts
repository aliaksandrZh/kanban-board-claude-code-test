import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProjectsService } from '../../core/projects.service';
import { Project } from '../../core/models';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (project) {
      <div class="project-shell">
        <header class="project-header">
          <h1>{{ project.name }}</h1>
          <p class="desc">{{ project.description }}</p>
          <nav class="tabs">
            <a
              [routerLink]="['/project', project.id]"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >Board</a>
            <a
              [routerLink]="['/project', project.id, 'wiki']"
              routerLinkActive="active"
            >Wiki</a>
          </nav>
        </header>
        <router-outlet />
      </div>
    } @else {
      <div class="not-found">Project not found.</div>
    }
  `,
  styles: `
    .project-shell {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 57px);
      overflow: hidden;
    }
    .project-header {
      padding: 1rem 1.5rem;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .desc {
      margin: 0.25rem 0 0.75rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
    .tabs {
      display: flex;
      gap: 0.5rem;
      a {
        padding: 0.5rem 1rem;
        text-decoration: none;
        color: #6b7280;
        border-radius: 0.375rem;
        font-weight: 500;
        font-size: 0.875rem;
        &.active {
          background: #eff6ff;
          color: #2563eb;
        }
        &:hover:not(.active) {
          background: #f9fafb;
          color: #374151;
        }
      }
    }
    .not-found {
      padding: 2rem;
      color: #6b7280;
    }
  `,
})
export class ProjectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectsService = inject(ProjectsService);

  project: Project | null = null;

  async ngOnInit(): Promise<void> {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.project = await this.projectsService.getProject(projectId);
    }
  }
}
