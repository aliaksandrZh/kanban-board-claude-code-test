import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { WikiStore } from './wiki.store';
import { AppStore } from './app.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../db/database';

describe('WikiStore', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    TestBed.configureTestingModule({ providers: [WikiStore, AppStore] });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create a wiki page', async () => {
    const store = TestBed.inject(WikiStore);
    const page = await store.createWikiPage('p1', 'Getting Started', '# Intro', 'user1');
    expect(page.title).toBe('Getting Started');
    expect(store.wikiPages().length).toBe(1);
  });

  it('should update a wiki page', async () => {
    const store = TestBed.inject(WikiStore);
    const page = await store.createWikiPage('p1', 'Old', 'Content', 'user1');
    await store.updateWikiPage(page.id, { title: 'New' }, 'user1');
    const updated = await store.getWikiPage(page.id);
    expect(updated?.title).toBe('New');
  });

  it('should delete a wiki page', async () => {
    const store = TestBed.inject(WikiStore);
    const page = await store.createWikiPage('p1', 'Page', '', 'user1');
    await store.deleteWikiPage(page.id);
    expect(store.wikiPages().length).toBe(0);
  });

  it('should filter project wiki pages', async () => {
    const store = TestBed.inject(WikiStore);
    await store.createWikiPage('p1', 'A', '', 'user1');
    await store.createWikiPage('p2', 'B', '', 'user1');
    expect(store.projectWikiPages('p1').length).toBe(1);
  });
});
