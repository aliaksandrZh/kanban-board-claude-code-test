import { computed, effect, Injectable, signal } from '@angular/core';
import { getDatabase } from '../db/database';
import type { User } from '../db/types';

@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly usersList = signal<User[]>([]);
  readonly users = computed(() => this.usersList());

  constructor() {
    this.init();
  }

  private init(): void {
    effect(() => {
      // dummy read to establish reactivity context
      void this.usersList();
    });
    this.subscribeToUsers();
  }

  private async subscribeToUsers(): Promise<void> {
    const db = await getDatabase();
    db.users.find().$.subscribe(docs => {
      this.usersList.set(docs.map(d => d.toMutableJSON() as User));
    });
  }

  async createUser(name: string): Promise<User> {
    const db = await getDatabase();
    const now = Date.now();
    const id = `user_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const user: User = { id, name, createdAt: now };
    await db.users.insert(user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.users.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }
}
