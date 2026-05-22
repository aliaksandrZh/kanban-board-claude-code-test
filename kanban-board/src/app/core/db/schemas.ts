import type { RxJsonSchema } from 'rxdb';
import type { User, Project, Card, Comment, WikiPage } from './types';

export const userSchema: RxJsonSchema<User> = {
  title: 'user schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    createdAt: { type: 'number' },
  },
  required: ['id', 'name', 'createdAt'],
};

export const projectSchema: RxJsonSchema<Project> = {
  title: 'project schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    description: { type: 'string' },
    createdAt: { type: 'number' },
    createdBy: { type: 'string' },
    modifiedAt: { type: 'number' },
    modifiedBy: { type: 'string' },
  },
  required: ['id', 'name', 'description', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'],
};

export const cardSchema: RxJsonSchema<Card> = {
  title: 'card schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    projectId: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['feature', 'task', 'bug'] },
    status: {
      type: 'string',
      enum: ['new', 'active', 'ready_to_test', 'completed', 'closed'],
    },
    assigneeId: { type: ['string', 'null'] },
    labels: {
      type: 'array',
      items: { type: 'string' },
    },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          completed: { type: 'boolean' },
        },
        required: ['id', 'text', 'completed'],
      },
    },
    relatedCardIds: {
      type: 'array',
      items: { type: 'string' },
    },
    createdAt: { type: 'number' },
    createdBy: { type: 'string' },
    modifiedAt: { type: 'number' },
    modifiedBy: { type: 'string' },
  },
  required: [
    'id',
    'projectId',
    'title',
    'description',
    'type',
    'status',
    'labels',
    'checklist',
    'relatedCardIds',
    'createdAt',
    'createdBy',
    'modifiedAt',
    'modifiedBy',
  ],
  indexes: ['projectId', 'status'],
};

export const commentSchema: RxJsonSchema<Comment> = {
  title: 'comment schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    cardId: { type: 'string', maxLength: 100 },
    text: { type: 'string' },
    createdAt: { type: 'number' },
    createdBy: { type: 'string' },
  },
  required: ['id', 'cardId', 'text', 'createdAt', 'createdBy'],
  indexes: ['cardId'],
};

export const wikiPageSchema: RxJsonSchema<WikiPage> = {
  title: 'wiki page schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    projectId: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    content: { type: 'string' },
    createdAt: { type: 'number' },
    createdBy: { type: 'string' },
    modifiedAt: { type: 'number' },
    modifiedBy: { type: 'string' },
  },
  required: ['id', 'projectId', 'title', 'content', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'],
  indexes: ['projectId'],
};
