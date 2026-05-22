import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WikiService } from '../../core/wiki.service';
import { AppStore } from '../../stores/app.store';

@Component({
  selector: 'app-wiki-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wiki-list">
      <div class="toolbar">
        <input
          type="text"
          placeholder="Page title"
          [(ngModel)]="newTitle"
          (keyup.enter)="createPage()"
        />
        <button (click)="createPage()">+ Page</button>
      </div>
      <div class="pages">
        @for (page of wikiService.pages(); track page.id) {
          <div class="page-item">
            <a
              class="page-title"
              [routerLink]="['/project', projectId, 'wiki', page.id]"
              >{{ page.title }}</a
            >
            <span class="page-meta"
              >{{ page.modifiedAt | date: 'short' }}</span
            >
            <button (click)="deletePage(page.id)">Delete</button>
          </div>
        } @empty {
          <p class="empty">No wiki pages yet.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .wiki-list {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .toolbar {
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
    .pages {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .page-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
    }
    .page-title {
      font-weight: 500;
      color: #111827;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
    .page-meta {
      color: #6b7280;
      font-size: 0.8125rem;
      flex: 1;
    }
    button {
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
export class WikiListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  wikiService = inject(WikiService);
  private appStore = inject(AppStore);

  projectId = '';
  newTitle = '';

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    this.wikiService.loadPages(this.projectId);
  }

  async createPage(): Promise<void> {
    const title = this.newTitle.trim();
    if (!title) return;
    const userId = this.appStore.currentUserId();
    if (!userId) {
      alert('Please select a user first.');
      return;
    }
    await this.wikiService.createPage(this.projectId, title, '', userId);
    this.newTitle = '';
  }

  async deletePage(id: string): Promise<void> {
    if (!confirm('Delete this page?')) return;
    await this.wikiService.deletePage(id);
  }
}
