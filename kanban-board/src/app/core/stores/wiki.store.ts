import { computed, Injectable, signal } from '@angular/core';
import { getDatabase } from '../db/database';
import type { WikiPage } from '../db/types';

@Injectable({ providedIn: 'root' })
export class WikiStore {
  private readonly wikiPagesList = signal<WikiPage[]>([]);
  readonly wikiPages = computed(() => this.wikiPagesList());

  constructor() {
    this.subscribeToWikiPages();
  }

  private async subscribeToWikiPages(): Promise<void> {
    const db = await getDatabase();
    db.wikiPages.find().$.subscribe(docs => {
      this.wikiPagesList.set(docs.map(d => d.toMutableJSON() as WikiPage));
    });
  }

  async createWikiPage(
    projectId: string,
    title: string,
    content: string,
    userId: string
  ): Promise<WikiPage> {
    const db = await getDatabase();
    const now = Date.now();
    const id = `wiki_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const page: WikiPage = {
      id,
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

  async updateWikiPage(id: string, patch: Partial<WikiPage>, userId: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.wikiPages.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...patch,
        modifiedAt: Date.now(),
        modifiedBy: userId,
      });
    }
  }

  async deleteWikiPage(id: string): Promise<void> {
    const db = await getDatabase();
    const doc = await db.wikiPages.findOne(id).exec();
    if (doc) {
      await doc.remove();
    }
  }

  async getWikiPage(id: string): Promise<WikiPage | null> {
    const db = await getDatabase();
    const doc = await db.wikiPages.findOne(id).exec();
    return doc ? (doc.toMutableJSON() as WikiPage) : null;
  }

  projectWikiPages(projectId: string): WikiPage[] {
    return this.wikiPages().filter(w => w.projectId === projectId);
  }
}
