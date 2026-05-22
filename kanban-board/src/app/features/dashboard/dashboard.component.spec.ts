import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { AppStore } from '../../core/stores/app.store';
import { ProjectsStore } from '../../core/stores/projects.store';
import { UsersStore } from '../../core/stores/users.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../../core/db/database';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await initTestDbForFile();
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await clearAllCollections(getDbUnsafe());
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [AppStore, ProjectsStore, UsersStore, provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('should render empty states', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No projects yet');
  });

  it('should create a project', async () => {
    const appStore = TestBed.inject(AppStore);
    await appStore.createDefaultUser();
    const component = fixture.componentInstance;
    component.newProjectName.set('Test');
    component.newProjectDesc.set('Desc');
    await component.createProject();
    expect(component.projects().length).toBe(1);
  });
});
