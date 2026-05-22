import { computed, Injectable, signal } from '@angular/core';
import { getDatabase } from '../db/database';
import type { Project } from '../db/types';

@Injectable({ providedIn: 'root' })
export class ProjectsStore {
  private readonly projectsList = signal<Project[]>([]);
  readonly projects = computed(() => this.projectsList());

  constructor() {
    this.subscribeToProjects();
  }

  private async subscribeToProjects(): Promise<void> {
    const db = await getDatabase();
    db.projects.find().$.subscribe(docs => {
      this.projectsList.set(docs.map(d => d.toMutableJSON() as Project));
    });
  }

  async createProject(
    name: string,
    description: string,
    userId: string
  ): Promise<Project> {
    const db = await getDatabase();
    const now = Date.now();
    const id = `project_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const project: Project = {
      id,
      name,
      description,
      createdAt: now,
      createdBy: userId,
      modifiedAt: now,
      modifiedBy: userId,
    };
    await db.projects.insert(project);
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.projects.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
    // Cascade delete cards, comments, wiki pages
    const cards = await db.cards.find({ selector: { projectId: id } }).exec();
    for (const c of cards) {
      const comments = await db.comments.find({ selector: { cardId: c.id } }).exec();
      for (const com of comments) await com.remove();
      await c.remove();
    }
    const wikiPages = await db.wikiPages.find({ selector: { projectId: id } }).exec();
    for (const w of wikiPages) await w.remove();
  }

  async getProject(id: string): Promise<Project | null> {
    const db = await getDatabase();
    const doc = await db.projects.findOne(id).exec();
    return doc ? (doc.toMutableJSON() as Project) : null;
  }
}
