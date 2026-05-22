import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppStore } from '../../core/stores/app.store';
import { WikiStore } from '../../core/stores/wiki.store';

@Component({
  selector: 'app-wiki-list',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="wiki-list">
      <div class="wiki-list__header">
        <h2>Wiki Pages</h2>
        <button class="btn btn--primary" (click)="showCreate.set(true)">New Page</button>
      </div>

      @if (showCreate()) {
        <div class="form">
          <input class="input" type="text" placeholder="Page title" [value]="newTitle()" (input)="newTitle.set($any($event).target.value)" />
          <div class="form__actions">
            <button class="btn" (click)="showCreate.set(false)">Cancel</button>
            <button class="btn btn--primary" (click)="createPage()">Create</button>
          </div>
        </div>
      }

      <ul class="list">
        @for (page of pages(); track page.id) {
          <li class="list__item">
            <a class="list__link" [routerLink]="['../wiki', page.id]">{{ page.title }}</a>
            <span class="list__meta">{{ page.modifiedAt | date:'short' }}</span>
            <button class="btn btn--danger btn--sm" (click)="deletePage(page.id)">Delete</button>
          </li>
        } @empty {
          <li class="list__empty">No wiki pages yet.</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .wiki-list { max-width: 900px; }
    .wiki-list__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .wiki-list__header h2 { font-size: 1.125rem; font-weight: 600; }
    .form { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
    .form__actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.75rem; }
    .input { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; width: 100%; }
    .btn { padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; background: #f3f4f6; color: #374151; }
    .btn--primary { background: #2563eb; color: #fff; }
    .btn--danger { background: #dc2626; color: #fff; }
    .btn--sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .list { list-style: none; }
    .list__item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid #f3f4f6; }
    .list__link { font-weight: 500; color: #2563eb; text-decoration: none; flex: 1; }
    .list__meta { font-size: 0.75rem; color: #6b7280; }
    .list__empty { color: #9ca3af; font-size: 0.875rem; }
  `,
})
export class WikiListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appStore = inject(AppStore);
  private readonly wikiStore = inject(WikiStore);

  readonly showCreate = signal(false);
  readonly newTitle = signal('');

  readonly projectId = computed(() => this.route.snapshot.parent?.paramMap.get('projectId') ?? '');
  readonly pages = computed(() => this.wikiStore.projectWikiPages(this.projectId()));

  async createPage(): Promise<void> {
    const pid = this.projectId();
    if (!pid) return;
    const title = this.newTitle().trim();
    if (!title) return;
    const page = await this.wikiStore.createWikiPage(pid, title, '', this.appStore.currentUserId());
    this.newTitle.set('');
    this.showCreate.set(false);
    await this.router.navigate(['/project', pid, 'wiki', page.id]);
  }

  async deletePage(id: string): Promise<void> {
    await this.wikiStore.deleteWikiPage(id);
  }
}
