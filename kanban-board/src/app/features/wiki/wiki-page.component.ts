import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppStore } from '../../core/stores/app.store';
import { WikiStore } from '../../core/stores/wiki.store';
import type { WikiPage } from '../../core/db/types';

@Component({
  selector: 'app-wiki-page',
  imports: [RouterLink, DatePipe],
  template: `
    @if (page(); as p) {
      <div class="wiki-page">
        <div class="wiki-page__header">
          <a class="back" [routerLink]="['/project', p.projectId, 'wiki']">← Back to Wiki</a>
          <input
            class="input input--title"
            type="text"
            [value]="editTitle()"
            (input)="editTitle.set($any($event).target.value)"
          />
        </div>
        <textarea
          class="input input--content"
          [value]="editContent()"
          (input)="editContent.set($any($event).target.value)"
          placeholder="Page content..."
        ></textarea>
        <div class="wiki-page__actions">
          <button class="btn btn--primary" (click)="save()">Save</button>
          <button class="btn" (click)="cancel()">Cancel</button>
        </div>
        <div class="wiki-page__meta">
          <span>Created {{ p.createdAt | date:'medium' }}</span>
          <span>Modified {{ p.modifiedAt | date:'medium' }}</span>
        </div>
      </div>
    } @else {
      <div class="not-found">Page not found.</div>
    }
  `,
  styles: `
    .wiki-page { max-width: 900px; }
    .wiki-page__header { margin-bottom: 1rem; }
    .back { font-size: 0.875rem; color: #2563eb; text-decoration: none; display: block; margin-bottom: 0.5rem; }
    .input { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; width: 100%; }
    .input--title { font-size: 1.25rem; font-weight: 700; border: none; padding: 0; border-bottom: 1px solid #e5e7eb; border-radius: 0; padding-bottom: 0.5rem; }
    .input--content { min-height: 400px; resize: vertical; margin-top: 1rem; font-family: monospace; }
    .wiki-page__actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .wiki-page__meta { display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.75rem; color: #6b7280; }
    .btn { padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; background: #f3f4f6; color: #374151; }
    .btn--primary { background: #2563eb; color: #fff; }
    .not-found { padding: 2rem; text-align: center; color: #6b7280; }
  `,
})
export class WikiPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appStore = inject(AppStore);
  private readonly wikiStore = inject(WikiStore);

  readonly page = signal<WikiPage | null>(null);
  readonly editTitle = signal('');
  readonly editContent = signal('');

  ngOnInit(): void {
    this.loadPage();
  }

  private async loadPage(): Promise<void> {
    const pageId = this.route.snapshot.paramMap.get('wikiPageId');
    const projectId = this.route.snapshot.parent?.paramMap.get('projectId');
    if (!pageId || !projectId) {
      await this.router.navigate(['/projects']);
      return;
    }
    const p = await this.wikiStore.getWikiPage(pageId);
    if (!p || p.projectId !== projectId) {
      await this.router.navigate(['/project', projectId, 'wiki']);
      return;
    }
    this.page.set(p);
    this.editTitle.set(p.title);
    this.editContent.set(p.content);
  }

  async save(): Promise<void> {
    const p = this.page();
    if (!p) return;
    await this.wikiStore.updateWikiPage(
      p.id,
      { title: this.editTitle().trim(), content: this.editContent() },
      this.appStore.currentUserId()
    );
    const updated = await this.wikiStore.getWikiPage(p.id);
    if (updated) this.page.set(updated);
  }

  cancel(): void {
    const p = this.page();
    if (!p) return;
    this.editTitle.set(p.title);
    this.editContent.set(p.content);
  }
}
