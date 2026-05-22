import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { CardsStore } from './cards.store';
import { AppStore } from './app.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../db/database';

describe('CardsStore', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    TestBed.configureTestingModule({ providers: [CardsStore, AppStore] });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create a card', async () => {
    const store = TestBed.inject(CardsStore);
    const card = await store.createCard('p1', 'Task A', 'Desc', 'task', 'user1');
    expect(card.title).toBe('Task A');
    expect(card.status).toBe('new');
    expect(store.cards().length).toBe(1);
  });

  it('should update a card', async () => {
    const store = TestBed.inject(CardsStore);
    const card = await store.createCard('p1', 'Task', 'Desc', 'task', 'user1');
    await store.updateCard(card.id, { title: 'Updated' }, 'user1');
    const updated = await store.getCard(card.id);
    expect(updated?.title).toBe('Updated');
  });

  it('should move a card status', async () => {
    const store = TestBed.inject(CardsStore);
    const card = await store.createCard('p1', 'Task', 'Desc', 'task', 'user1');
    await store.moveCard(card.id, 'active', 'user1');
    const updated = await store.getCard(card.id);
    expect(updated?.status).toBe('active');
  });

  it('should filter project cards', async () => {
    const store = TestBed.inject(CardsStore);
    await store.createCard('p1', 'A', '', 'task', 'user1');
    await store.createCard('p2', 'B', '', 'task', 'user1');
    expect(store.projectCards('p1').length).toBe(1);
    expect(store.projectCards('p1')[0].title).toBe('A');
  });
});
