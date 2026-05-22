import { Injectable, inject, signal, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { DbService } from './db.service';
import { User } from './models';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private dbService = inject(DbService);
  private _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();
  private sub?: Subscription;

  async loadUsers(): Promise<void> {
    const db = this.dbService.getDb();
    const docs = await db.users.find().sort({ createdAt: 'asc' }).exec();
    this._users.set(docs.map((d) => d.toMutableJSON()));

    this.sub?.unsubscribe();
    this.sub = db.users.find().sort({ createdAt: 'asc' }).$.subscribe((updatedDocs) => {
      this._users.set(updatedDocs.map((d) => d.toMutableJSON()));
    });
  }

  async createUser(name: string): Promise<User> {
    const db = this.dbService.getDb();
    const user: User = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
    };
    await db.users.insert(user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.users.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }

  async getUser(id: string): Promise<User | null> {
    const db = this.dbService.getDb();
    const doc = await db.users.findOne(id).exec();
    return doc ? doc.toMutableJSON() : null;
  }
}
