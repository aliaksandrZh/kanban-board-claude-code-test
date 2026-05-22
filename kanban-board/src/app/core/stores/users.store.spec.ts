import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { UsersStore } from './users.store';
import { AppStore } from './app.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../db/database';

describe('UsersStore', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    TestBed.configureTestingModule({ providers: [UsersStore, AppStore] });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create a user', async () => {
    const store = TestBed.inject(UsersStore);
    await store.createUser('Alice');
    const users = store.users();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe('Alice');
  });

  it('should delete a user', async () => {
    const store = TestBed.inject(UsersStore);
    const user = await store.createUser('Bob');
    expect(store.users().length).toBe(1);
    await store.deleteUser(user.id);
    expect(store.users().length).toBe(0);
  });
});
