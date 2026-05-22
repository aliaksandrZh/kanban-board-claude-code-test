import { Injectable, inject } from '@angular/core';
import {
  createRxDatabase,
  addRxPlugin,
  RxDatabase,
  RxCollection,
  RxJsonSchema,
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { createReactivityFactory } from 'rxdb/plugins/reactivity-angular';
import { Injector } from '@angular/core';

import {
  User,
  Project,
  Card,
  Comment,
  WikiPage,
} from './models';

export type KanbanCollections = {
  users: RxCollection<User>;
  projects: RxCollection<Project>;
  cards: RxCollection<Card>;
  comments: RxCollection<Comment>;
  wikiPages: RxCollection<WikiPage>;
};

export type KanbanDatabase = RxDatabase<KanbanCollections>;

const userSchema: RxJsonSchema<User> = {
  title: 'user schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'createdAt'],
};

const projectSchema: RxJsonSchema<Project> = {
  title: 'project schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    description: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string' },
    modifiedAt: { type: 'string', format: 'date-time' },
    modifiedBy: { type: 'string' },
  },
  required: ['id', 'name', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'],
};

const cardSchema: RxJsonSchema<Card> = {
  title: 'card schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 36 },
    projectId: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    description: { type: 'string' },
    type: {
      type: 'string',
      enum: ['feature', 'task', 'bug'],
    },
    status: {
      type: 'string',
      enum: ['new', 'active', 'ready_to_test', 'completed', 'closed'],
    },
    assigneeId: { type: 'string' },
    labels: {
      type: 'array',
      items: { type: 'string' },
    },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', maxLength: 36 },
          text: { type: 'string' },
          completed: { type: 'boolean' },
        },
      },
    },
    relatedCardIds: {
      type: 'array',
      items: { type: 'string', maxLength: 36 },
    },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string' },
    modifiedAt: { type: 'string', format: 'date-time' },
    modifiedBy: { type: 'string' },
  },
  required: [
    'id',
    'projectId',
    'title',
    'type',
    'status',
    'createdAt',
    'createdBy',
    'modifiedAt',
    'modifiedBy',
  ],
};

const commentSchema: RxJsonSchema<Comment> = {
  title: 'comment schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 36 },
    cardId: { type: 'string', maxLength: 36 },
    text: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string' },
  },
  required: ['id', 'cardId', 'text', 'createdAt', 'createdBy'],
};

const wikiPageSchema: RxJsonSchema<WikiPage> = {
  title: 'wiki page schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 36 },
    projectId: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    content: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string' },
    modifiedAt: { type: 'string', format: 'date-time' },
    modifiedBy: { type: 'string' },
  },
  required: [
    'id',
    'projectId',
    'title',
    'createdAt',
    'createdBy',
    'modifiedAt',
    'modifiedBy',
  ],
};

@Injectable({ providedIn: 'root' })
export class DbService {
  private injector = inject(Injector);
  private db: KanbanDatabase | null = null;

  async init(): Promise<KanbanDatabase> {
    if (this.db) return this.db;

    addRxPlugin(RxDBDevModePlugin);

    const db = await createRxDatabase<KanbanCollections>({
      name: 'kanban_db',
      storage: getRxStorageDexie(),
      reactivity: createReactivityFactory(this.injector),
    });

    await db.addCollections({
      users: { schema: userSchema },
      projects: { schema: projectSchema },
      cards: { schema: cardSchema },
      comments: { schema: commentSchema },
      wikiPages: { schema: wikiPageSchema },
    });

    const rootUser = await db.users.findOne('root').exec();
    if (!rootUser) {
      await db.users.insert({
        id: 'root',
        name: 'root',
        createdAt: new Date().toISOString(),
      });
    }

    this.db = db;
    return db;
  }

  getDb(): KanbanDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }
}
