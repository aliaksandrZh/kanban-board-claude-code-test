import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { BoardComponent } from './board.component';
import { AppStore } from '../../core/stores/app.store';
import { CardsStore } from '../../core/stores/cards.store';
import { UsersStore } from '../../core/stores/users.store';
import { ProjectsStore } from '../../core/stores/projects.store';
import { initTestDbForFile, clearAllCollections } from '../../../testing/test-db';
import { getDbUnsafe } from '../../core/db/database';

describe('BoardComponent', () => {
  let fixture: ComponentFixture<BoardComponent>;
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
      imports: [BoardComponent],
      providers: [
        AppStore,
        CardsStore,
        UsersStore,
        ProjectsStore,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              parent: { paramMap: convertToParamMap({ projectId: 'project_test' }) },
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    const projectsStore = TestBed.inject(ProjectsStore);
    await projectsStore.createProject('P', 'D', 'user1');

    fixture = TestBed.createComponent(BoardComponent);
    fixture.detectChanges();
  });

  it('should render columns', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('New');
    expect(compiled.textContent).toContain('Active');
    expect(compiled.textContent).toContain('Ready to Test');
  });
});
