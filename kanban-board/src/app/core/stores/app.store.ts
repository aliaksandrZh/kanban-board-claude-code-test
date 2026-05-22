import { effect, Injectable, signal } from '@angular/core';
import { getDatabase } from '../db/database';
import type { User } from '../db/types';

const CURRENT_USER_KEY = 'kanban_current_user';

@Injectable({ providedIn: 'root' })
export class AppStore {
  readonly currentUser = signal<User | null>(null);

  constructor() {
    this.loadCurrentUser();
    effect(() => {
      const user = this.currentUser();
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      }
    });
  }

  private async loadCurrentUser(): Promise<void> {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        this.currentUser.set(parsed);
        return;
      } catch {
        // ignore
      }
    }
    const db = await getDatabase();
    const root = await db.users.findOne('root').exec();
    if (root) {
      this.currentUser.set(root.toMutableJSON() as User);
    }
  }

  setCurrentUser(user: User): void {
    this.currentUser.set(user);
  }

  async createDefaultUser(): Promise<void> {
    const db = await getDatabase();
    const existing = await db.users.findOne('root').exec();
    if (!existing) {
      const now = Date.now();
      await db.users.insert({
        id: 'root',
        name: 'root',
        createdAt: now,
      });
      const root = await db.users.findOne('root').exec();
      if (root) {
        this.currentUser.set(root.toMutableJSON() as User);
      }
    }
  }

  currentUserId(): string {
    return this.currentUser()?.id ?? 'root';
  }

  currentUserName(): string {
    return this.currentUser()?.name ?? 'root';
  }
}
