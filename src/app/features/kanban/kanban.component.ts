import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardsService } from '../../core/cards.service';
import { UsersService } from '../../core/users.service';
import { AppStore } from '../../stores/app.store';
import { Card, CardStatus, User } from '../../core/models';

const COLUMNS: { id: CardStatus; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'active', label: 'Active' },
  { id: 'ready_to_test', label: 'Ready to Test' },
  { id: 'completed', label: 'Completed' },
  { id: 'closed', label: 'Closed' },
];

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, RouterLink],
  template: `
    <div class="kanban">
      <div class="toolbar">
        <input
          type="text"
          placeholder="New card title"
          [(ngModel)]="newCardTitle"
          (keyup.enter)="createCard()"
        />
        <select [(ngModel)]="newCardType">
          <option value="task">Task</option>
          <option value="feature">Feature</option>
          <option value="bug">Bug</option>
        </select>
        <button (click)="createCard()">+ Card</button>
      </div>

      <div class="board">
        @for (col of columns; track col.id) {
          <div class="column"
            [id]="col.id"
            cdkDropList
            [cdkDropListData]="cardsByColumn()[col.id]"
            [cdkDropListConnectedTo]="connectedTo()"
            (cdkDropListDropped)="drop($event)"
          >
            <h3 class="column-header">
              {{ col.label }}
              <span class="count">{{ cardsByColumn()[col.id].length }}</span>
            </h3>
            <div class="cards">
              @for (card of cardsByColumn()[col.id]; track card.id) {
                <a
                  class="card"
                  [routerLink]="['/project', projectId, 'card', card.id]"
                  cdkDrag
                  [cdkDragData]="card"
                >
                  <div class="card-title">{{ card.title }}</div>
                  <div class="card-meta">
                    <span class="badge type-{{ card.type }}">{{ card.type }}</span>
                    @if (getAssignee(card.assigneeId); as user) {
                      <span class="assignee">{{ user.name }}</span>
                    }
                  </div>
                  @if (card.labels.length) {
                    <div class="labels">
                      @for (label of card.labels; track label) {
                        <span class="label">{{ label }}</span>
                      }
                    </div>
                  }
                  @if (card.checklist.length) {
                    <div class="checklist-progress">
                      <div
                        class="progress-bar"
                        [style.width.%]="checklistProgress(card)"
                      ></div>
                    </div>
                  }
                </a>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .kanban {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1rem 1.5rem;
      gap: 1rem;
    }
    .toolbar {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      input {
        flex: 1;
        max-width: 300px;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }
      select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        background: #fff;
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
    .board {
      display: flex;
      gap: 1rem;
      flex: 1;
      overflow-x: auto;
      overflow-y: hidden;
    }
    .column {
      flex: 1;
      min-width: 260px;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      background: #e5e7eb;
      border-radius: 0.5rem;
      padding: 0.75rem;
      gap: 0.5rem;
      overflow: hidden;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      padding: 0 0.25rem;
      .count {
        background: #d1d5db;
        color: #374151;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
      }
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    .card {
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.75rem;
      cursor: grab;
      text-decoration: none;
      color: inherit;
      display: block;
      &:active {
        cursor: grabbing;
      }
      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
    }
    .card-title {
      font-weight: 500;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: #111827;
    }
    .card-meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .badge {
      font-size: 0.6875rem;
      text-transform: uppercase;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      &.type-feature {
        background: #dbeafe;
        color: #1e40af;
      }
      &.type-task {
        background: #dcfce7;
        color: #166534;
      }
      &.type-bug {
        background: #fee2e2;
        color: #991b1b;
      }
    }
    .assignee {
      font-size: 0.75rem;
      color: #6b7280;
    }
    .labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    .label {
      font-size: 0.6875rem;
      background: #f3f4f6;
      color: #4b5563;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
    }
    .checklist-progress {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin-top: 0.5rem;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: #22c55e;
      border-radius: 2px;
      transition: width 0.2s;
    }
    .cdk-drag-preview {
      opacity: 0.9;
      transform: rotate(2deg);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
  `,
})
export class KanbanComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cardsService = inject(CardsService);
  private usersService = inject(UsersService);
  private appStore = inject(AppStore);

  projectId = '';
  columns = COLUMNS;
  newCardTitle = '';
  newCardType: 'task' | 'feature' | 'bug' = 'task';

  cardsByColumn = computed(() => {
    const map: Record<CardStatus, Card[]> = {
      new: [],
      active: [],
      ready_to_test: [],
      completed: [],
      closed: [],
    };
    for (const card of this.cardsService.cards()) {
      if (card.projectId === this.projectId) {
        map[card.status].push(card);
      }
    }
    return map;
  });

  connectedTo = computed(() =>
    COLUMNS.map((c) => c.id)
  );

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    this.cardsService.loadCards(this.projectId);
  }

  getAssignee(assigneeId: string | null): User | undefined {
    if (!assigneeId) return undefined;
    return this.usersService.users().find((u) => u.id === assigneeId);
  }

  checklistProgress(card: Card): number {
    if (!card.checklist.length) return 0;
    const done = card.checklist.filter((i) => i.completed).length;
    return Math.round((done / card.checklist.length) * 100);
  }

  async createCard(): Promise<void> {
    const title = this.newCardTitle.trim();
    if (!title) return;
    const userId = this.appStore.currentUserId();
    if (!userId) {
      alert('Please select a user first.');
      return;
    }
    await this.cardsService.createCard(
      this.projectId,
      title,
      this.newCardType,
      userId
    );
    this.newCardTitle = '';
  }

  async drop(event: CdkDragDrop<Card[]>): Promise<void> {
    if (event.previousContainer === event.container) return;

    const card = event.item.data as Card;
    const newStatus = event.container.id as CardStatus;
    const userId = this.appStore.currentUserId();
    if (!userId) {
      alert('Please select a user first.');
      return;
    }
    try {
      await this.cardsService.updateCardStatus(card.id, newStatus, userId);
    } catch (err) {
      alert((err as Error).message);
    }
  }
}
