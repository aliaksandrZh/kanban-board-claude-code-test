import type { RxJsonSchema } from 'rxdb';
import type { User, Project, Card, Comment, WikiPage } from './types';

export const userSchema: RxJsonSchema<User> = {
  title: 'user schema',
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 100 },
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
    name: { type: 'string', maxLength: 200 },
    description: { type: 'string', maxLength: 5000 },
    createdAt: { type: 'number' },
    createdBy: { type: 'string', maxLength: 100 },
    modifiedAt: { type: 'number' },
    modifiedBy: { type: 'string', maxLength: 100 },
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
    title: { type: 'string', maxLength: 200 },
    description: { type: 'string', maxLength: 5000 },
    type: { type: 'string', enum: ['feature', 'task', 'bug'], maxLength: 20 },
    status: {
      type: 'string',
      enum: ['new', 'active', 'ready_to_test', 'completed', 'closed'],
      maxLength: 20,
    },
    assigneeId: { type: ['string', 'null'], maxLength: 100 },
    labels: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
    },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', maxLength: 100 },
          text: { type: 'string', maxLength: 500 },
          completed: { type: 'boolean' },
        },
        required: ['id', 'text', 'completed'],
      },
    },
    relatedCardIds: {
      type: 'array',
      items: { type: 'string', maxLength: 100 },
    },
    createdAt: { type: 'number' },
    createdBy: { type: 'string', maxLength: 100 },
    modifiedAt: { type: 'number' },
    modifiedBy: { type: 'string', maxLength: 100 },
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
    text: { type: 'string', maxLength: 2000 },
    createdAt: { type: 'number' },
    createdBy: { type: 'string', maxLength: 100 },
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
    title: { type: 'string', maxLength: 200 },
    content: { type: 'string', maxLength: 50000 },
    createdAt: { type: 'number' },
    createdBy: { type: 'string', maxLength: 100 },
    modifiedAt: { type: 'number' },
    modifiedBy: { type: 'string', maxLength: 100 },
  },
  required: ['id', 'projectId', 'title', 'content', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'],
  indexes: ['projectId'],
};
