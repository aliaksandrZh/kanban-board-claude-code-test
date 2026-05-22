import { createRxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { userSchema, projectSchema, cardSchema, commentSchema, wikiPageSchema } from '../app/core/db/schemas';
import { resetDatabase, setDatabaseInstance } from '../app/core/db/database';
import type { KanbanDatabase, KanbanCollections } from '../app/core/db/database';

let fileCounter = 0;

export async function initTestDbForFile(): Promise<{ db: KanbanDatabase; cleanup: () => Promise<void> }> {
  resetDatabase();
  fileCounter++;
  const db = await createRxDatabase<KanbanCollections>({
    name: `test_${fileCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    storage: getRxStorageMemory(),
    multiInstance: false,
  });
  await db.addCollections({
    users: { schema: userSchema },
    projects: { schema: projectSchema },
    cards: { schema: cardSchema },
    comments: { schema: commentSchema },
    wikiPages: { schema: wikiPageSchema },
  });
  setDatabaseInstance(db);

  return {
    db,
    cleanup: async () => {
      resetDatabase();
      await db.close();
    },
  };
}

export async function clearAllCollections(db: KanbanDatabase): Promise<void> {
  const users = await db.users.find().exec();
  for (const d of users) await d.remove();
  const projects = await db.projects.find().exec();
  for (const d of projects) await d.remove();
  const cards = await db.cards.find().exec();
  for (const d of cards) await d.remove();
  const comments = await db.comments.find().exec();
  for (const d of comments) await d.remove();
  const wikiPages = await db.wikiPages.find().exec();
  for (const d of wikiPages) await d.remove();
}
