import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { AppStore } from './app.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../db/database';

describe('AppStore', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    TestBed.configureTestingModule({ providers: [AppStore] });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create default root user', async () => {
    const store = TestBed.inject(AppStore);
    await store.createDefaultUser();
    expect(store.currentUser()).not.toBeNull();
    expect(store.currentUserName()).toBe('root');
  });

  it('should set current user', async () => {
    const store = TestBed.inject(AppStore);
    await store.createDefaultUser();
    const root = store.currentUser()!;
    store.setCurrentUser({ ...root, name: 'Alice' });
    expect(store.currentUserName()).toBe('Alice');
  });
});
