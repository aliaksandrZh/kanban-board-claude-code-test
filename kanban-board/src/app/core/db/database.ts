import { createRxDatabase, type RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { userSchema, projectSchema, cardSchema, commentSchema, wikiPageSchema } from './schemas';
import type { User, Project, Card, Comment, WikiPage } from './types';

export type KanbanDatabase = RxDatabase<{
  users: import('rxdb').RxCollection<User>;
  projects: import('rxdb').RxCollection<Project>;
  cards: import('rxdb').RxCollection<Card>;
  comments: import('rxdb').RxCollection<Comment>;
  wikiPages: import('rxdb').RxCollection<WikiPage>;
}>;

let dbInstance: KanbanDatabase | null = null;

export async function getDatabase(): Promise<KanbanDatabase> {
  if (dbInstance) return dbInstance;

  const db = await createRxDatabase<KanbanDatabase>({
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
