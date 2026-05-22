import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { CommentsStore } from './comments.store';
import { AppStore } from './app.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../db/database';

describe('CommentsStore', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    TestBed.configureTestingModule({ providers: [CommentsStore, AppStore] });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create a comment', async () => {
    const store = TestBed.inject(CommentsStore);
    await store.createComment('c1', 'Nice work', 'user1');
    expect(store.comments().length).toBe(1);
    expect(store.comments()[0].text).toBe('Nice work');
  });

  it('should delete a comment', async () => {
    const store = TestBed.inject(CommentsStore);
    const comment = await store.createComment('c1', 'Nice work', 'user1');
    await store.deleteComment(comment.id);
    expect(store.comments().length).toBe(0);
  });

  it('should filter card comments', async () => {
    const store = TestBed.inject(CommentsStore);
    await store.createComment('c1', 'A', 'user1');
    await store.createComment('c2', 'B', 'user1');
    expect(store.cardComments('c1').length).toBe(1);
    expect(store.cardComments('c1')[0].text).toBe('A');
  });
});
