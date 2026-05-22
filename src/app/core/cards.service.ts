import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DbService } from './db.service';
import { Card, CardStatus, Comment, ChecklistItem } from './models';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  new: ['active', 'closed'],
  active: ['ready_to_test', 'new', 'closed'],
  ready_to_test: ['active', 'closed', 'completed'],
  completed: [],
  closed: [],
};

@Injectable({ providedIn: 'root' })
export class CardsService {
  private dbService = inject(DbService);
  private _cards = signal<Card[]>([]);
  readonly cards = this._cards.asReadonly();
  private cardsSub?: Subscription;

  async loadCards(projectId?: string): Promise<void> {
    const db = this.dbService.getDb();
    const selector = projectId ? { selector: { projectId } } : {};
    const docs = await db.cards.find(selector).sort({ createdAt: 'desc' }).exec();
    this._cards.set(docs.map((d) => d.toMutableJSON()));

    this.cardsSub?.unsubscribe();
    this.cardsSub = db.cards.find(selector).sort({ createdAt: 'desc' }).$.subscribe((updatedDocs) => {
      this._cards.set(updatedDocs.map((d) => d.toMutableJSON()));
    });
  }

  canTransition(from: CardStatus, to: CardStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  async createCard(
    projectId: string,
    title: string,
    type: 'feature' | 'task' | 'bug',
    userId: string
  ): Promise<Card> {
    const db = this.dbService.getDb();
    const now = new Date().toISOString();
    const card: Card = {
      id: uuidv4(),
      projectId,
      title,
      description: '',
      type,
      status: 'new',
      assigneeId: null,
      labels: [],
      checklist: [],
      relatedCardIds: [],
      createdAt: now,
      createdBy: userId,
      modifiedAt: now,
      modifiedBy: userId,
    };
    await db.cards.insert(card);
    return card;
  }

  async updateCard(id: string, patch: Partial<Card>, userId: string): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.cards.findOne(id).exec();
    if (!doc) return;
    const update: Partial<Card> = {
      ...patch,
      modifiedAt: new Date().toISOString(),
      modifiedBy: userId,
    };
    await doc.patch(update);
  }

  async updateCardStatus(
    id: string,
    status: CardStatus,
    userId: string
  ): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.cards.findOne(id).exec();
    if (!doc) return;
    const current = doc.get('status') as CardStatus;
    if (!this.canTransition(current, status)) {
      throw new Error(`Invalid transition from ${current} to ${status}`);
    }
    await doc.patch({
      status,
      modifiedAt: new Date().toISOString(),
      modifiedBy: userId,
    });
  }

  async deleteCard(id: string): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.cards.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }

  async getCard(id: string): Promise<Card | null> {
    const db = this.dbService.getDb();
    const doc = await db.cards.findOne(id).exec();
    return doc ? doc.toMutableJSON() : null;
  }

  // Comments
  private _comments = signal<Comment[]>([]);
  readonly comments = this._comments.asReadonly();
  private commentsSub?: Subscription;

  async loadComments(cardId: string): Promise<void> {
    const db = this.dbService.getDb();
    const docs = await db.comments
      .find({ selector: { cardId } })
      .sort({ createdAt: 'asc' })
      .exec();
    this._comments.set(docs.map((d) => d.toMutableJSON()));

    this.commentsSub?.unsubscribe();
    this.commentsSub = db.comments
      .find({ selector: { cardId } })
      .sort({ createdAt: 'asc' })
      .$.subscribe((updatedDocs) => {
        this._comments.set(updatedDocs.map((d) => d.toMutableJSON()));
      });
  }

  async addComment(cardId: string, text: string, userId: string): Promise<void> {
    const db = this.dbService.getDb();
    await db.comments.insert({
      id: uuidv4(),
      cardId,
      text,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    });
  }

  async deleteComment(id: string): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.comments.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }
}
