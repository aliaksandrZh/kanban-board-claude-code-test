import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WikiService } from '../../core/wiki.service';
import { AppStore } from '../../stores/app.store';
import { WikiPage } from '../../core/models';

@Component({
  selector: 'app-wiki-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (page(); as p) {
      <div class="wiki-page">
        <header>
          <a
            class="back-link"
            [routerLink]="['/project', p.projectId, 'wiki']"
          >← Back to Wiki</a>
        </header>

        <input
          class="title-input"
          [(ngModel)]="p.title"
          (blur)="saveField('title', p.title)"
          (keyup.enter)="saveField('title', p.title)"
        />

        @if (renderMarkdown()) {
          <div class="content-preview" [innerHTML]="renderedContent()"></div>
        } @else {
          <textarea
            class="content-editor"
            [(ngModel)]="p.content"
            (blur)="saveField('content', p.content)"
            rows="20"
          ></textarea>
        }

        <div class="editor-toggle">
          <label>
            <input
              type="checkbox"
              [ngModel]="renderMarkdown()"
              (ngModelChange)="toggleRender($event)"
            />
            Render markdown
          </label>
        </div>

        <div class="meta">
          <span>Created: {{ p.createdAt | date: 'medium' }}</span>
          <span>Modified: {{ p.modifiedAt | date: 'medium' }}</span>
        </div>
      </div>
    } @else {
      <div class="not-found">Wiki page not found.</div>
    }
  `,
  styles: `
    .wiki-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    header {
      margin-bottom: 1rem;
    }
    .back-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      &:hover {
        text-decoration: underline;
      }
    }
    .title-input {
      width: 100%;
      font-size: 1.5rem;
      font-weight: 600;
      border: 1px solid transparent;
      padding: 0.5rem;
      border-radius: 0.375rem;
      margin-bottom: 0.75rem;
      &:focus {
        border-color: #d1d5db;
        outline: none;
      }
      &:hover {
        border-color: #e5e7eb;
      }
    }
    .editor-toggle {
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #4b5563;
      label {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        cursor: pointer;
      }
      input {
        width: auto;
      }
    }
    .content-editor {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-family: ui-monospace, monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      resize: vertical;
      &:focus {
        outline: none;
        border-color: #2563eb;
      }
    }
    .content-preview {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 1rem;
      font-size: 0.875rem;
      line-height: 1.6;
      min-height: 300px;
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }
      p {
        margin: 0 0 0.75rem 0;
      }
      ul, ol {
        margin: 0 0 0.75rem 1.25rem;
        padding: 0;
      }
      code {
        background: #f3f4f6;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: ui-monospace, monospace;
      }
      pre {
        background: #f3f4f6;
        padding: 0.75rem;
        border-radius: 0.375rem;
        overflow-x: auto;
      }
      blockquote {
        border-left: 3px solid #d1d5db;
        margin: 0 0 0.75rem 0;
        padding-left: 0.75rem;
        color: #6b7280;
      }
    }
    .meta {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #9ca3af;
      display: flex;
      gap: 1rem;
    }
    .not-found {
      padding: 2rem;
      color: #6b7280;
    }
  `,
})
export class WikiPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private wikiService = inject(WikiService);
  private appStore = inject(AppStore);

  page = signal<WikiPage | null>(null);
  renderMarkdown = signal(false);

  // Simple markdown rendering: basic replacements
  renderedContent = signal('');

  async ngOnInit(): Promise<void> {
    const pageId = this.route.snapshot.paramMap.get('wikiPageId');
    if (!pageId) return;
    const p = await this.wikiService.getPage(pageId);
    if (p) {
      this.page.set(p);
      this.updateRendered();
    }
  }

  async saveField(field: keyof WikiPage, value: unknown): Promise<void> {
    const p = this.page();
    if (!p) return;
    const userId = this.appStore.currentUserId();
    if (!userId) return;
    await this.wikiService.updatePage(
      p.id,
      { [field]: value } as Partial<WikiPage>,
      userId
    );
    const updated = await this.wikiService.getPage(p.id);
    if (updated) {
      this.page.set(updated);
      this.updateRendered();
    }
  }

  toggleRender(value: boolean): void {
    this.renderMarkdown.set(value);
    this.updateRendered();
  }

  private updateRendered(): void {
    const p = this.page();
    if (!p) return;
    this.renderedContent.set(this.simpleMarkdown(p.content));
  }

  private simpleMarkdown(text: string): string {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Bold / italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // Blockquote
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    // Paragraphs
    html = html.replace(/\n\n/g, '</p>\n\n<p>');
    html = '<p>' + html + '</p>';
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    return html;
  }
}
