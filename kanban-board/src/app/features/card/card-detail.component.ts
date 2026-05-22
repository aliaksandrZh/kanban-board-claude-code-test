import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AppStore } from '../../core/stores/app.store';
import { CardsStore } from '../../core/stores/cards.store';
import { CommentsStore } from '../../core/stores/comments.store';
import { UsersStore } from '../../core/stores/users.store';
import type { Card, CardStatus, ChecklistItem } from '../../core/db/types';

@Component({
  selector: 'app-card-detail',
  imports: [RouterLink, DatePipe],
  template: `
    @if (card(); as c) {
      <div class="card-detail">
        <div class="card-detail__header">
          <a class="back" [routerLink]="['/project', c.projectId, 'board']">← Back to Board</a>
          <h1 class="card-detail__title">{{ c.title }}</h1>
          <div class="badges">
            <span class="badge badge--{{ c.type }}">{{ c.type }}</span>
            <span class="badge badge--status">{{ c.status }}</span>
          </div>
        </div>

        <div class="card-detail__grid">
          <div class="card-detail__main">
            <section class="section">
              <h3 class="section__title">Description</h3>
              <textarea class="input input--area" [value]="editDesc()" (input)="editDesc.set($any($event).target.value)"></textarea>
              <button class="btn btn--primary" (click)="saveDesc()">Save</button>
            </section>

            <section class="section">
              <h3 class="section__title">Checklist</h3>
              <div class="checklist">
                @for (item of c.checklist; track item.id) {
                  <div class="checklist__item">
                    <input type="checkbox" [checked]="item.completed" (change)="toggleChecklistItem(item.id)" />
                    <span [class.strike]="item.completed">{{ item.text }}</span>
                    <button class="btn btn--sm" (click)="deleteChecklistItem(item.id)">Delete</button>
                  </div>
                }
              </div>
              <div class="inline-form">
                <input class="input" type="text" placeholder="New item" [value]="newChecklistText()" (input)="newChecklistText.set($any($event).target.value)" />
                <button class="btn btn--primary" (click)="addChecklistItem()">Add</button>
              </div>
            </section>

            <section class="section">
              <h3 class="section__title">Comments</h3>
              <div class="comments">
                @for (comment of comments(); track comment.id) {
                  <div class="comment">
                    <div class="comment__meta">{{ userName(comment.createdBy) }} — {{ comment.createdAt | date:'short' }}</div>
                    <div class="comment__text">{{ comment.text }}</div>
                    <button class="btn btn--sm btn--danger" (click)="deleteComment(comment.id)">Delete</button>
                  </div>
                } @empty {
                  <p class="empty">No comments yet.</p>
                }
              </div>
              <div class="inline-form">
                <input class="input" type="text" placeholder="Add a comment" [value]="newComment()" (input)="newComment.set($any($event).target.value)" />
                <button class="btn btn--primary" (click)="addComment()">Post</button>
              </div>
            </section>
          </div>

          <aside class="card-detail__sidebar">
            <section class="section">
              <h4 class="section__title">Assignee</h4>
              <select class="input" [value]="c.assigneeId ?? ''" (change)="updateAssignee($any($event).target.value)">
                <option value="">Unassigned</option>
                @for (user of users(); track user.id) {
                  <option [value]="user.id">{{ user.name }}</option>
                }
              </select>
            </section>

            <section class="section">
              <h4 class="section__title">Status</h4>
              <select class="input" [value]="c.status" (change)="updateStatus($any($event).target.value)">
                <option value="new">New</option>
                <option value="active">Active</option>
                <option value="ready_to_test">Ready to Test</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </section>

            <section class="section">
              <h4 class="section__title">Labels</h4>
              <div class="tags">
                @for (label of c.labels; track label) {
                  <span class="tag">{{ label }} <button class="tag__remove" (click)="removeLabel(label)">×</button></span>
                }
              </div>
              <div class="inline-form">
                <input class="input" type="text" placeholder="Label" [value]="newLabel()" (input)="newLabel.set($any($event).target.value)" />
                <button class="btn btn--primary" (click)="addLabel()">Add</button>
              </div>
            </section>

            <section class="section">
              <h4 class="section__title">Related Cards</h4>
              <ul class="related-list">
                @for (rc of relatedCards(); track rc.id) {
                  <li><a [routerLink]="['/project', c.projectId, 'card', rc.id]">{{ rc.title }}</a></li>
                }
              </ul>
              <div class="inline-form">
                <select class="input" [value]="newRelatedId()" (change)="newRelatedId.set($any($event).target.value)">
                  <option value="">Select card...</option>
                  @for (other of otherProjectCards(); track other.id) {
                    <option [value]="other.id">{{ other.title }}</option>
                  }
                </select>
                <button class="btn btn--primary" (click)="addRelated()">Link</button>
              </div>
            </section>

            <section class="section">
              <h4 class="section__title">Metadata</h4>
              <p class="meta">Created by {{ userName(c.createdBy) }} on {{ c.createdAt | date:'medium' }}</p>
              <p class="meta">Modified by {{ userName(c.modifiedBy) }} on {{ c.modifiedAt | date:'medium' }}</p>
            </section>

            <button class="btn btn--danger btn--block" (click)="deleteCard()">Delete Card</button>
          </aside>
        </div>
      </div>
    } @else {
      <div class="not-found">Card not found.</div>
    }
  `,
  styles: `
    .card-detail { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .card-detail__header { margin-bottom: 1.5rem; }
    .back { font-size: 0.875rem; color: #2563eb; text-decoration: none; }
    .card-detail__title { font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; }
    .badges { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .badge { font-size: 0.625rem; font-weight: 600; text-transform: uppercase; padding: 0.125rem 0.5rem; border-radius: 0.25rem; }
    .badge--feature { background: #dbeafe; color: #1e40af; }
    .badge--task { background: #dcfce7; color: #166534; }
    .badge--bug { background: #fee2e2; color: #991b1b; }
    .badge--status { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .card-detail__grid { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; }
    .section { margin-bottom: 1.5rem; }
    .section__title { font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.025em; }
    .input { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; width: 100%; }
    .input--area { min-height: 100px; resize: vertical; }
    .btn { padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; background: #f3f4f6; color: #374151; }
    .btn--primary { background: #2563eb; color: #fff; }
    .btn--danger { background: #dc2626; color: #fff; }
    .btn--sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .btn--block { width: 100%; }
    .checklist__item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; }
    .strike { text-decoration: line-through; color: #9ca3af; flex: 1; }
    .inline-form { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .comments { display: flex; flex-direction: column; gap: 0.75rem; }
    .comment { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem; }
    .comment__meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; }
    .comment__text { font-size: 0.875rem; color: #374151; }
    .empty { font-size: 0.875rem; color: #9ca3af; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .tag { font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.25rem 0.5rem; border-radius: 0.25rem; border: 1px solid #e5e7eb; display: inline-flex; align-items: center; gap: 0.25rem; }
    .tag__remove { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 0.75rem; }
    .related-list { list-style: none; font-size: 0.875rem; }
    .related-list a { color: #2563eb; text-decoration: none; }
    .meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; }
    .not-found { padding: 2rem; text-align: center; color: #6b7280; }
    @media (max-width: 768px) { .card-detail__grid { grid-template-columns: 1fr; } }
  `,
})
export class CardDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appStore = inject(AppStore);
  private readonly cardsStore = inject(CardsStore);
  private readonly commentsStore = inject(CommentsStore);
  private readonly usersStore = inject(UsersStore);

  readonly card = signal<Card | null>(null);
  readonly editDesc = signal('');
  readonly newComment = signal('');
  readonly newChecklistText = signal('');
  readonly newLabel = signal('');
  readonly newRelatedId = signal('');

  readonly comments = computed(() => this.commentsStore.cardComments(this.card()?.id ?? ''));
  readonly users = computed(() => this.usersStore.users());
  readonly relatedCards = computed(() => {
    const c = this.card();
    if (!c) return [];
    return this.cardsStore.cards().filter(x => c.relatedCardIds.includes(x.id));
  });
  readonly otherProjectCards = computed(() => {
    const c = this.card();
    if (!c) return [];
    return this.cardsStore.cards().filter(x => x.projectId === c.projectId && x.id !== c.id && !c.relatedCardIds.includes(x.id));
  });

  constructor() {
    this.loadCard();
  }

  private async loadCard(): Promise<void> {
    const cardId = this.route.snapshot.paramMap.get('cardId');
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (!cardId || !projectId) {
      await this.router.navigate(['/projects']);
      return;
    }
    const c = await this.cardsStore.getCard(cardId);
    if (!c || c.projectId !== projectId) {
      await this.router.navigate(['/project', projectId, 'board']);
      return;
    }
    this.card.set(c);
    this.editDesc.set(c.description);
  }

  userName(id: string): string {
    return this.usersStore.users().find(u => u.id === id)?.name ?? '';
  }

  async saveDesc(): Promise<void> {
    const c = this.card();
    if (!c) return;
    await this.cardsStore.updateCard(c.id, { description: this.editDesc() }, this.appStore.currentUserId());
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async updateAssignee(value: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const assigneeId = value || null;
    await this.cardsStore.updateCard(c.id, { assigneeId }, this.appStore.currentUserId());
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async updateStatus(value: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const status = value as CardStatus;
    await this.cardsStore.updateCard(c.id, { status }, this.appStore.currentUserId());
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async toggleChecklistItem(id: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const checklist = c.checklist.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
    await this.cardsStore.updateCard(c.id, { checklist }, this.appStore.currentUserId());
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async deleteChecklistItem(id: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const checklist = c.checklist.filter(i => i.id !== id);
    await this.cardsStore.updateCard(c.id, { checklist }, this.appStore.currentUserId());
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async addChecklistItem(): Promise<void> {
    const c = this.card();
    if (!c) return;
    const text = this.newChecklistText().trim();
    if (!text) return;
    const item: ChecklistItem = { id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, text, completed: false };
    await this.cardsStore.updateCard(c.id, { checklist: [...c.checklist, item] }, this.appStore.currentUserId());
    this.newChecklistText.set('');
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async addComment(): Promise<void> {
    const c = this.card();
    if (!c) return;
    const text = this.newComment().trim();
    if (!text) return;
    await this.commentsStore.createComment(c.id, text, this.appStore.currentUserId());
    this.newComment.set('');
  }

  async deleteComment(id: string): Promise<void> {
    await this.commentsStore.deleteComment(id);
  }

  async addLabel(): Promise<void> {
    const c = this.card();
    if (!c) return;
    const label = this.newLabel().trim();
    if (!label || c.labels.includes(label)) return;
    await this.cardsStore.updateCard(c.id, { labels: [...c.labels, label] }, this.appStore.currentUserId());
    this.newLabel.set('');
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async removeLabel(label: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    await this.cardsStore.updateCard(c.id, { labels: c.labels.filter(l => l !== label) }, this.appStore.currentUserId());
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async addRelated(): Promise<void> {
    const c = this.card();
    if (!c) return;
    const id = this.newRelatedId();
    if (!id || c.relatedCardIds.includes(id)) return;
    await this.cardsStore.updateCard(c.id, { relatedCardIds: [...c.relatedCardIds, id] }, this.appStore.currentUserId());
    this.newRelatedId.set('');
    const updated = await this.cardsStore.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async deleteCard(): Promise<void> {
    const c = this.card();
    if (!c) return;
    await this.cardsStore.deleteCard(c.id);
    await this.router.navigate(['/project', c.projectId, 'board']);
  }
}
