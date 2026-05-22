import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { ProjectsStore } from './projects.store';
import { AppStore } from './app.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../db/database';

describe('ProjectsStore', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    TestBed.configureTestingModule({ providers: [ProjectsStore, AppStore] });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should create a project', async () => {
    const store = TestBed.inject(ProjectsStore);
    await store.createProject('Test Project', 'Description', 'user1');
    const projects = store.projects();
    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe('Test Project');
    expect(projects[0].createdBy).toBe('user1');
  });

  it('should delete a project and cascade', async () => {
    const store = TestBed.inject(ProjectsStore);
    const project = await store.createProject('P', 'D', 'user1');
    expect(store.projects().length).toBe(1);
    await store.deleteProject(project.id);
    expect(store.projects().length).toBe(0);
  });

  it('should get a project by id', async () => {
    const store = TestBed.inject(ProjectsStore);
    const project = await store.createProject('P', 'D', 'user1');
    const found = await store.getProject(project.id);
    expect(found?.name).toBe('P');
  });
});
