import { computed, Injectable, signal } from '@angular/core';
import { getDatabase } from '../db/database';
import type { Card, CardStatus } from '../db/types';

@Injectable({ providedIn: 'root' })
export class CardsStore {
  private readonly cardsList = signal<Card[]>([]);
  readonly cards = computed(() => this.cardsList());

  constructor() {
    this.subscribeToCards();
  }

  private async subscribeToCards(): Promise<void> {
    const db = await getDatabase();
    db.cards.find().$.subscribe(docs => {
      this.cardsList.set(docs.map(d => d.toMutableJSON() as Card));
    });
  }

  async createCard(
    projectId: string,
    title: string,
    description: string,
    type: Card['type'],
    userId: string
  ): Promise<Card> {
    const db = await getDatabase();
    const now = Date.now();
    const id = `card_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const card: Card = {
      id,
      projectId,
      title,
      description,
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
    const db = await getDatabase();
    const doc = await db.cards.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...patch,
        modifiedAt: Date.now(),
        modifiedBy: userId,
      });
    }
  }

  async deleteCard(id: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.cards.findOne(id).exec();
    if (doc) {
      // Remove from related cards
      const related = await db.cards.find({ selector: { relatedCardIds: { $in: [id] } } }).exec();
      for (const r of related) {
        const ids = r.relatedCardIds.filter(cid => cid !== id);
        await r.patch({ relatedCardIds: ids });
      }
      // Delete comments
      const comments = await db.comments.find({ selector: { cardId: id } }).exec();
      for (const c of comments) await c.remove();
      await doc.remove();
    }
  }

  async moveCard(id: string, status: CardStatus, userId: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.cards.findOne(id).exec();
    if (doc) {
      await doc.patch({
        status,
        modifiedAt: Date.now(),
        modifiedBy: userId,
      });
    }
  }

  async getCard(id: string): Promise<Card | null> {
    const db = await getDatabase();
    const doc = await db.cards.findOne(id).exec();
    return doc ? (doc.toMutableJSON() as Card) : null;
  }

  projectCards(projectId: string): Card[] {
    return this.cards().filter(c => c.projectId === projectId);
  }
}
