import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CardsService } from '../../core/cards.service';
import { UsersService } from '../../core/users.service';
import { ProjectsService } from '../../core/projects.service';
import { AppStore } from '../../stores/app.store';
import { Card, CardStatus, ChecklistItem, User } from '../../core/models';
import { v4 as uuidv4 } from 'uuid';

const CARD_STATUSES: CardStatus[] = [
  'new',
  'active',
  'ready_to_test',
  'completed',
  'closed',
];

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (card(); as c) {
      <div class="card-detail">
        <header class="detail-header">
          <a
            class="back-link"
            [routerLink]="['/project', c.projectId]"
          >← Back to Board</a>
          <div class="header-actions">
            <button class="btn-danger" (click)="deleteCard()">Delete Card</button>
          </div>
        </header>

        <div class="detail-body">
          <div class="main">
            <input
              class="title-input"
              [(ngModel)]="c.title"
              (blur)="saveField('title', c.title)"
              (keyup.enter)="saveField('title', c.title)"
            />

            <div class="field">
              <label>Description</label>
              <textarea
                [(ngModel)]="c.description"
                (blur)="saveField('description', c.description)"
                rows="4"
              ></textarea>
            </div>

            <div class="field">
              <label>Type</label>
              <select
                [ngModel]="c.type"
                (ngModelChange)="saveField('type', $event)"
              >
                <option value="feature">Feature</option>
                <option value="task">Task</option>
                <option value="bug">Bug</option>
              </select>
            </div>

            <div class="field">
              <label>Status</label>
              <select
                [ngModel]="c.status"
                (ngModelChange)="changeStatus($event)"
              >
                @for (s of CARD_STATUSES; track s) {
                  <option [value]="s">{{ s | titlecase }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label>Assignee</label>
              <select
                [ngModel]="c.assigneeId"
                (ngModelChange)="saveField('assigneeId', $event)"
              >
                <option [value]="null">Unassigned</option>
                @for (user of usersService.users(); track user.id) {
                  <option [value]="user.id">{{ user.name }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label>Labels</label>
              <div class="tags">
                @for (label of c.labels; track label) {
                  <span class="tag"
                    >{{ label }}<button (click)="removeLabel(label)">×</button></span
                  >
                }
              </div>
              <input
                type="text"
                placeholder="Add label + Enter"
                [(ngModel)]="newLabel"
                (keyup.enter)="addLabel()"
              />
            </div>

            <div class="field">
              <label>Checklist</label>
              <div class="checklist">
                @for (item of c.checklist; track item.id) {
                  <div class="check-item">
                    <input
                      type="checkbox"
                      [ngModel]="item.completed"
                      (ngModelChange)="toggleCheckItem(item.id)"
                    />
                    <span [class.done]="item.completed">{{ item.text }}</span>
                    <button (click)="deleteCheckItem(item.id)">×</button>
                  </div>
                }
              </div>
              <input
                type="text"
                placeholder="Add checklist item + Enter"
                [(ngModel)]="newCheckItem"
                (keyup.enter)="addCheckItem()"
              />
            </div>

            <div class="field">
              <label>Related Cards</label>
              <div class="related-list">
                @for (relatedId of c.relatedCardIds; track relatedId) {
                  <div class="related-item">
                    @if (getCardTitle(relatedId); as title) {
                      <a
                        [routerLink]="['/project', c.projectId, 'card', relatedId]"
                        >{{ title }}</a
                      >
                    }
                    <button (click)="removeRelatedCard(relatedId)">×</button>
                  </div>
                }
              </div>
              <select
                [(ngModel)]="newRelatedCardId"
                (ngModelChange)="addRelatedCard()"
              >
                <option [value]="''">Link a card...</option>
                @for (oc of otherCards(); track oc.id) {
                  <option [value]="oc.id">{{ oc.title }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label>Comments</label>
              <div class="comments">
                @for (comment of cardsService.comments(); track comment.id) {
                  <div class="comment">
                    <div class="comment-meta">
                      <span class="author">{{ getUserName(comment.createdBy) }}</span>
                      <span class="date">{{ comment.createdAt | date: 'short' }}</span>
                      <button (click)="deleteComment(comment.id)">Delete</button>
                    </div>
                    <p>{{ comment.text }}</p>
                  </div>
                }
              </div>
              <textarea
                [(ngModel)]="newComment"
                placeholder="Write a comment..."
                rows="2"
              ></textarea>
              <button (click)="addComment()">Add Comment</button>
            </div>
          </div>

          <aside class="sidebar">
            <div class="meta">
              <div>
                <span>Created by:</span> {{ getUserName(c.createdBy) }}
              </div>
              <div>
                <span>Created at:</span> {{ c.createdAt | date: 'short' }}
              </div>
              <div>
                <span>Modified by:</span> {{ getUserName(c.modifiedBy) }}
              </div>
              <div>
                <span>Modified at:</span> {{ c.modifiedAt | date: 'short' }}
              </div>
            </div>
          </aside>
        </div>
      </div>
    } @else {
      <div class="not-found">Card not found.</div>
    }
  `,
  styles: `
    .card-detail {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .back-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
      &:hover {
        text-decoration: underline;
      }
    }
    .btn-danger {
      padding: 0.5rem 1rem;
      background: #ef4444;
      color: #fff;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
      &:hover {
        background: #dc2626;
      }
    }
    .detail-body {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 1.5rem;
    }
    .title-input {
      width: 100%;
      font-size: 1.5rem;
      font-weight: 600;
      border: 1px solid transparent;
      padding: 0.5rem;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
      &:focus {
        border-color: #d1d5db;
        outline: none;
      }
      &:hover {
        border-color: #e5e7eb;
      }
    }
    .field {
      margin-bottom: 1.25rem;
      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 0.375rem;
      }
      input,
      textarea,
      select {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-family: inherit;
        &:focus {
          outline: none;
          border-color: #2563eb;
        }
      }
      button {
        margin-top: 0.5rem;
        padding: 0.4rem 0.75rem;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
        &:hover {
          background: #1d4ed8;
        }
      }
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.5rem;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #eff6ff;
      color: #1e40af;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      button {
        margin: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
      }
    }
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 0.5rem;
    }
    .check-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      input[type='checkbox'] {
        width: auto;
        margin: 0;
      }
      span {
        flex: 1;
        font-size: 0.875rem;
        &.done {
          text-decoration: line-through;
          color: #9ca3af;
        }
      }
      button {
        margin: 0;
        padding: 0 0.25rem;
        background: transparent;
        color: #9ca3af;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        &:hover {
          color: #ef4444;
        }
      }
    }
    .related-list {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 0.5rem;
    }
    .related-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      a {
        color: #2563eb;
        text-decoration: none;
        font-size: 0.875rem;
        &:hover {
          text-decoration: underline;
        }
      }
      button {
        margin: 0;
        padding: 0 0.25rem;
        background: transparent;
        color: #9ca3af;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        &:hover {
          color: #ef4444;
        }
      }
    }
    .comments {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .comment {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.75rem;
      p {
        margin: 0.5rem 0 0 0;
        font-size: 0.875rem;
      }
    }
    .comment-meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      .author {
        font-weight: 600;
        font-size: 0.875rem;
      }
      .date {
        color: #9ca3af;
        font-size: 0.75rem;
      }
      button {
        margin: 0 0 0 auto;
        padding: 0.125rem 0.375rem;
        background: transparent;
        color: #9ca3af;
        border: none;
        cursor: pointer;
        font-size: 0.75rem;
        &:hover {
          color: #ef4444;
        }
      }
    }
    .sidebar {
      .meta {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 1rem;
        font-size: 0.8125rem;
        color: #4b5563;
        div {
          margin-bottom: 0.5rem;
          span {
            color: #9ca3af;
            font-weight: 500;
          }
        }
      }
    }
    .not-found {
      padding: 2rem;
      color: #6b7280;
    }
  `,
})
export class CardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  cardsService = inject(CardsService);
  usersService = inject(UsersService);
  private appStore = inject(AppStore);

  card = signal<Card | null>(null);
  newLabel = '';
  newCheckItem = '';
  newComment = '';
  newRelatedCardId = '';

  otherCards = signal<Card[]>([]);

  readonly CARD_STATUSES = CARD_STATUSES;

  async ngOnInit(): Promise<void> {
    const cardId = this.route.snapshot.paramMap.get('cardId');
    if (!cardId) return;

    const c = await this.cardsService.getCard(cardId);
    if (!c) return;
    this.card.set(c);

    this.cardsService.loadComments(cardId);

    const projectCards = this.cardsService.cards().filter(
      (x) => x.projectId === c.projectId && x.id !== c.id
    );
    this.otherCards.set(projectCards);
  }

  getUserName(userId: string): string {
    const u = this.usersService.users().find((x) => x.id === userId);
    return u ? u.name : userId;
  }

  getCardTitle(cardId: string): string | null {
    const c = this.cardsService.cards().find((x) => x.id === cardId);
    return c ? c.title : null;
  }

  async saveField(field: keyof Card, value: unknown): Promise<void> {
    const c = this.card();
    if (!c) return;
    const userId = this.appStore.currentUserId();
    if (!userId) return;
    await this.cardsService.updateCard(c.id, { [field]: value } as Partial<Card>, userId);
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async changeStatus(status: CardStatus): Promise<void> {
    const c = this.card();
    if (!c) return;
    const userId = this.appStore.currentUserId();
    if (!userId) return;
    try {
      await this.cardsService.updateCardStatus(c.id, status, userId);
      const updated = await this.cardsService.getCard(c.id);
      if (updated) this.card.set(updated);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async addLabel(): Promise<void> {
    const text = this.newLabel.trim();
    if (!text) return;
    const c = this.card();
    if (!c) return;
    const labels = [...c.labels, text];
    await this.saveField('labels', labels);
    this.newLabel = '';
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async removeLabel(label: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const labels = c.labels.filter((l) => l !== label);
    await this.saveField('labels', labels);
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async addCheckItem(): Promise<void> {
    const text = this.newCheckItem.trim();
    if (!text) return;
    const c = this.card();
    if (!c) return;
    const item: ChecklistItem = { id: uuidv4(), text, completed: false };
    const checklist = [...c.checklist, item];
    await this.saveField('checklist', checklist);
    this.newCheckItem = '';
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async toggleCheckItem(itemId: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const checklist = c.checklist.map((i) =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    await this.saveField('checklist', checklist);
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async deleteCheckItem(itemId: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const checklist = c.checklist.filter((i) => i.id !== itemId);
    await this.saveField('checklist', checklist);
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async addRelatedCard(): Promise<void> {
    const id = this.newRelatedCardId;
    if (!id) return;
    const c = this.card();
    if (!c) return;
    if (c.relatedCardIds.includes(id)) return;
    const related = [...c.relatedCardIds, id];
    await this.saveField('relatedCardIds', related);
    this.newRelatedCardId = '';
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async removeRelatedCard(id: string): Promise<void> {
    const c = this.card();
    if (!c) return;
    const related = c.relatedCardIds.filter((x) => x !== id);
    await this.saveField('relatedCardIds', related);
    const updated = await this.cardsService.getCard(c.id);
    if (updated) this.card.set(updated);
  }

  async addComment(): Promise<void> {
    const text = this.newComment.trim();
    if (!text) return;
    const c = this.card();
    if (!c) return;
    const userId = this.appStore.currentUserId();
    if (!userId) {
      alert('Please select a user first.');
      return;
    }
    await this.cardsService.addComment(c.id, text, userId);
    this.newComment = '';
  }

  async deleteComment(id: string): Promise<void> {
    await this.cardsService.deleteComment(id);
  }

  async deleteCard(): Promise<void> {
    const c = this.card();
    if (!c) return;
    if (!confirm('Delete this card?')) return;
    await this.cardsService.deleteCard(c.id);
    this.router.navigate(['/project', c.projectId]);
  }
}
