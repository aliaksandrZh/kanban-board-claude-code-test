import { computed, Injectable, signal } from '@angular/core';
import { getDatabase } from '../db/database';
import type { Comment } from '../db/types';

@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly commentsList = signal<Comment[]>([]);
  readonly comments = computed(() => this.commentsList());

  constructor() {
    this.subscribeToComments();
  }

  private async subscribeToComments(): Promise<void> {
    const db = await getDatabase();
    db.comments.find().$.subscribe(docs => {
      this.commentsList.set(docs.map(d => d.toMutableJSON() as Comment));
    });
  }

  async createComment(cardId: string, text: string, userId: string): Promise<Comment> {
    const db = await getDatabase();
    const now = Date.now();
    const id = `comment_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const comment: Comment = { id, cardId, text, createdAt: now, createdBy: userId };
    await db.comments.insert(comment);
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.comments.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }

  cardComments(cardId: string): Comment[] {
    return this.comments().filter(c => c.cardId === cardId).sort((a, b) => a.createdAt - b.createdAt);
  }
}
