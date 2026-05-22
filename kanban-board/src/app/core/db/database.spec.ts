import { beforeAll, beforeEach, describe, expect, it, afterAll } from 'vitest';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import type { KanbanDatabase } from './database';

describe('Database', () => {
  let db: KanbanDatabase;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    db = result.db;
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(db);
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create and read a user', async () => {
    await db.users.insert({ id: 'u1', name: 'Alice', createdAt: 1 });
    const doc = await db.users.findOne('u1').exec();
    expect(doc?.toMutableJSON().name).toBe('Alice');
  });

  it('should create and read a project', async () => {
    await db.projects.insert({
      id: 'p1',
      name: 'Test',
      description: 'Desc',
      createdAt: 1,
      createdBy: 'u1',
      modifiedAt: 1,
      modifiedBy: 'u1',
    });
    const doc = await db.projects.findOne('p1').exec();
    expect(doc?.toMutableJSON().name).toBe('Test');
  });

  it('should create and read a card', async () => {
    await db.cards.insert({
      id: 'c1',
      projectId: 'p1',
      title: 'Card',
      description: '',
      type: 'task',
      status: 'new',
      assigneeId: null,
      labels: [],
      checklist: [],
      relatedCardIds: [],
      createdAt: 1,
      createdBy: 'u1',
      modifiedAt: 1,
      modifiedBy: 'u1',
    });
    const doc = await db.cards.findOne('c1').exec();
    expect(doc?.toMutableJSON().title).toBe('Card');
  });

  it('should query cards by projectId', async () => {
    await db.cards.insert({
      id: 'c1',
      projectId: 'p1',
      title: 'A',
      description: '',
      type: 'task',
      status: 'new',
      assigneeId: null,
      labels: [],
      checklist: [],
      relatedCardIds: [],
      createdAt: 1,
      createdBy: 'u1',
      modifiedAt: 1,
      modifiedBy: 'u1',
    });
    await db.cards.insert({
      id: 'c2',
      projectId: 'p2',
      title: 'B',
      description: '',
      type: 'task',
      status: 'new',
      assigneeId: null,
      labels: [],
      checklist: [],
      relatedCardIds: [],
      createdAt: 1,
      createdBy: 'u1',
      modifiedAt: 1,
      modifiedBy: 'u1',
    });
    const docs = await db.cards.find({ selector: { projectId: 'p1' } }).exec();
    expect(docs.length).toBe(1);
    expect(docs[0].toMutableJSON().title).toBe('A');
  });
});
