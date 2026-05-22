import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DbService } from './db.service';
import { WikiPage } from './models';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class WikiService {
  private dbService = inject(DbService);
  private _pages = signal<WikiPage[]>([]);
  readonly pages = this._pages.asReadonly();
  private sub?: Subscription;

  async loadPages(projectId: string): Promise<void> {
    const db = this.dbService.getDb();
    const docs = await db.wikiPages
      .find({ selector: { projectId } })
      .sort({ createdAt: 'desc' })
      .exec();
    this._pages.set(docs.map((d) => d.toMutableJSON()));

    this.sub?.unsubscribe();
    this.sub = db.wikiPages
      .find({ selector: { projectId } })
      .sort({ createdAt: 'desc' })
      .$.subscribe((updatedDocs) => {
        this._pages.set(updatedDocs.map((d) => d.toMutableJSON()));
      });
  }

  async createPage(
    projectId: string,
    title: string,
    content: string,
    userId: string
  ): Promise<WikiPage> {
    const db = this.dbService.getDb();
    const now = new Date().toISOString();
    const page: WikiPage = {
      id: uuidv4(),
      projectId,
      title,
      content,
      createdAt: now,
      createdBy: userId,
      modifiedAt: now,
      modifiedBy: userId,
    };
    await db.wikiPages.insert(page);
    return page;
  }

  async updatePage(
    id: string,
    patch: Partial<WikiPage>,
    userId: string
  ): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.wikiPages.findOne(id).exec();
    if (!doc) return;
    await doc.patch({
      ...patch,
      modifiedAt: new Date().toISOString(),
      modifiedBy: userId,
    });
  }

  async deletePage(id: string): Promise<void> {
    const db = this.dbService.getDb();
    const doc = await db.wikiPages.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }

  async getPage(id: string): Promise<WikiPage | null> {
    const db = this.dbService.getDb();
    const doc = await db.wikiPages.findOne(id).exec();
    return doc ? doc.toMutableJSON() : null;
  }
}
