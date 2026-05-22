import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DbService } from './db.service';
import { Project } from './models';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private dbService = inject(DbService);
  private _projects = signal<Project[]>([]);
  readonly projects = this._projects.asReadonly();
  private sub?: Subscription;

  async loadProjects(): Promise<void> {
    const db = this.dbService.getDb();
    const docs = await db.projects.find().sort({ createdAt: 'desc' }).exec();
    this._projects.set(docs.map((d) => d.toMutableJSON()));

    this.sub?.unsubscribe();
    this.sub = db.projects.find().sort({ createdAt: 'desc' }).$.subscribe((updatedDocs) => {
      this._projects.set(updatedDocs.map((d) => d.toMutableJSON()));
    });
  }

  async createProject(
    name: string,
    description: string,
    userId: string
  ): Promise<Project> {
    const db = this.dbService.getDb();
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
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
    const db = this.dbService.getDb();
    const doc = await db.projects.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }

  async getProject(id: string): Promise<Project | null> {
    const db = this.dbService.getDb();
    const doc = await db.projects.findOne(id).exec();
    return doc ? doc.toMutableJSON() : null;
  }
}
