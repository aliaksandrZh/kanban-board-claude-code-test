import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppStore } from '../../core/stores/app.store';
import { CardsStore } from '../../core/stores/cards.store';
import { UsersStore } from '../../core/stores/users.store';
import type { Card, CardStatus } from '../../core/db/types';

const COLUMNS: { status: CardStatus; title: string }[] = [
  { status: 'new', title: 'New' },
  { status: 'active', title: 'Active' },
  { status: 'ready_to_test', title: 'Ready to Test' },
  { status: 'completed', title: 'Completed' },
  { status: 'closed', title: 'Closed' },
];

const VALID_TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  new: ['active', 'closed'],
  active: ['ready_to_test', 'new', 'closed'],
  ready_to_test: ['active', 'closed', 'completed'],
  completed: [],
  closed: [],
};

function canTransition(from: CardStatus, to: CardStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

@Component({
  selector: 'app-board',
  imports: [],
  template: `
    <div class="board">
      <div class="board__header">
        <button class="btn btn--primary" (click)="showCreate.set(true)">New Card</button>
      </div>
      @if (showCreate()) {
        <div class="modal">
          <div class="modal__overlay" (click)="showCreate.set(false)"></div>
          <div class="modal__content">
            <h3>Create Card</h3>
            <input class="input" type="text" placeholder="Title" [value]="newTitle()" (input)="newTitle.set($any($event).target.value)" />
            <textarea class="input" placeholder="Description" [value]="newDesc()" (input)="newDesc.set($any($event).target.value)"></textarea>
            <select class="input" [value]="newType()" (change)="newType.set($any($event).target.value)">
              <option value="feature">Feature</option>
              <option value="task">Task</option>
              <option value="bug">Bug</option>
            </select>
            <div class="modal__actions">
              <button class="btn" (click)="showCreate.set(false)">Cancel</button>
              <button class="btn btn--primary" (click)="createCard()">Create</button>
            </div>
          </div>
        </div>
      }
      <div class="board__columns">
        @for (col of columns; track col.status) {
          <div
            class="column"
            [class.column--drop-target]="dropTarget() === col.status"
            (dragover)="onDragOver($event, col.status)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event, col.status)"
          >
            <div class="column__header">
              <span class="column__title">{{ col.title }}</span>
              <span class="column__count">{{ cardsByStatus()[col.status].length }}</span>
            </div>
            <div class="column__cards">
              @for (card of cardsByStatus()[col.status]; track card.id) {
                <div
                  class="card"
                  draggable="true"
                  (dragstart)="onDragStart($event, card)"
                  (click)="openCard(card.id)"
                >
                  <div class="card__title">{{ card.title }}</div>
                  <div class="card__meta">
                    <span class="badge badge--{{ card.type }}">{{ card.type }}</span>
                    @if (card.assigneeId) {
                      <span class="card__assignee">{{ userName(card.assigneeId) }}</span>
                    }
                  </div>
                  @if (card.labels.length > 0) {
                    <div class="card__labels">
                      @for (label of card.labels; track label) {
                        <span class="label">{{ label }}</span>
                      }
                    </div>
                  }
                  @if (card.checklist.length > 0) {
                    <div class="card__progress">
                      {{ completedCount(card.checklist) }}/{{ card.checklist.length }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .board {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .board__header {
      padding-bottom: 0.75rem;
    }
    .board__columns {
      display: flex;
      gap: 1rem;
      flex: 1;
      overflow-x: auto;
    }
    .column {
      min-width: 260px;
      max-width: 340px;
      flex: 1;
      background: #f3f4f6;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      padding: 0.75rem;
      transition: background 0.2s;
    }
    .column--drop-target {
      background: #e0e7ff;
    }
    .column__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
    }
    .column__count {
      background: #e5e7eb;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
    }
    .column__cards {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: box-shadow 0.15s;
    }
    .card:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .card__title {
      font-weight: 500;
      font-size: 0.875rem;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .card__meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .badge {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
    }
    .badge--feature { background: #dbeafe; color: #1e40af; }
    .badge--task { background: #dcfce7; color: #166534; }
    .badge--bug { background: #fee2e2; color: #991b1b; }
    .card__assignee {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .card__labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }
    .label {
      font-size: 0.625rem;
      background: #f3f4f6;
      color: #374151;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
    }
    .card__progress {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
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
    .btn--primary { background: #2563eb; color: #fff; }
    .input {
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      width: 100%;
      margin-bottom: 0.5rem;
    }
    .modal {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal__overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
    }
    .modal__content {
      position: relative;
      background: #fff;
      border-radius: 0.5rem;
      padding: 1.25rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    .modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
  `,
})
export class BoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appStore = inject(AppStore);
  private readonly cardsStore = inject(CardsStore);
  private readonly usersStore = inject(UsersStore);

  readonly columns = COLUMNS;
  readonly showCreate = signal(false);
  readonly newTitle = signal('');
  readonly newDesc = signal('');
  readonly newType = signal<'feature' | 'task' | 'bug'>('feature');
  readonly dropTarget = signal<CardStatus | null>(null);

  readonly projectId = computed(() => this.route.snapshot.parent?.paramMap.get('projectId') ?? '');

  readonly cardsByStatus = computed(() => {
    const map: Record<CardStatus, Card[]> = {
      new: [],
      active: [],
      ready_to_test: [],
      completed: [],
      closed: [],
    };
    const pid = this.projectId();
    for (const card of this.cardsStore.cards()) {
      if (card.projectId === pid) {
        map[card.status].push(card);
      }
    }
    for (const key of Object.keys(map) as CardStatus[]) {
      map[key].sort((a, b) => b.createdAt - a.createdAt);
    }
    return map;
  });

  private draggedCard: Card | null = null;

  userName(id: string | null): string {
    if (!id) return '';
    return this.usersStore.users().find(u => u.id === id)?.name ?? '';
  }

  completedCount(checklist: Card['checklist']): number {
    return checklist.filter(i => i.completed).length;
  }

  onDragStart(event: DragEvent, card: Card): void {
    this.draggedCard = card;
    event.dataTransfer?.setData('text/plain', card.id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, status: CardStatus): void {
    event.preventDefault();
    if (this.draggedCard && canTransition(this.draggedCard.status, status)) {
      this.dropTarget.set(status);
      event.dataTransfer!.dropEffect = 'move';
    } else {
      event.dataTransfer!.dropEffect = 'none';
    }
  }

  onDragLeave(_event: DragEvent): void {
    this.dropTarget.set(null);
  }

  onDrop(event: DragEvent, status: CardStatus): void {
    event.preventDefault();
    this.dropTarget.set(null);
    const card = this.draggedCard;
    if (!card) return;
    if (!canTransition(card.status, status)) return;
    this.cardsStore.moveCard(card.id, status, this.appStore.currentUserId());
    this.draggedCard = null;
  }

  openCard(cardId: string): void {
    const pid = this.projectId();
    if (pid) {
      this.router.navigate(['/project', pid, 'card', cardId]);
    }
  }

  async createCard(): Promise<void> {
    const pid = this.projectId();
    if (!pid) return;
    const title = this.newTitle().trim();
    if (!title) return;
    await this.cardsStore.createCard(pid, title, this.newDesc().trim(), this.newType(), this.appStore.currentUserId());
    this.newTitle.set('');
    this.newDesc.set('');
    this.newType.set('feature');
    this.showCreate.set(false);
  }
}
