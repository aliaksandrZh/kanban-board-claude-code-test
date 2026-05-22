import { createRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { userSchema, projectSchema, cardSchema, commentSchema, wikiPageSchema } from './schemas';
import type { User, Project, Card, Comment, WikiPage } from './types';

import type { RxCollection } from 'rxdb';

export type KanbanCollections = {
  users: RxCollection<User>;
  projects: RxCollection<Project>;
  cards: RxCollection<Card>;
  comments: RxCollection<Comment>;
  wikiPages: RxCollection<WikiPage>;
};

export type KanbanDatabase = RxDatabase<KanbanCollections>;

let dbInstance: KanbanDatabase | null = null;

export async function getDatabase(): Promise<KanbanDatabase> {
  if (dbInstance) return dbInstance;

  const db = await createRxDatabase<KanbanCollections>({
    name: 'kanban_db',
    storage: getRxStorageDexie(),
  });

  await db.addCollections({
    users: { schema: userSchema },
    projects: { schema: projectSchema },
    cards: { schema: cardSchema },
    comments: { schema: commentSchema },
    wikiPages: { schema: wikiPageSchema },
  });

  dbInstance = db;
  return db;
}

export function getDbUnsafe(): KanbanDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized yet');
  }
  return dbInstance;
}

export function resetDatabase(): void {
  dbInstance = null;
}

export function setDatabaseInstance(db: KanbanDatabase): void {
  dbInstance = db;
}
