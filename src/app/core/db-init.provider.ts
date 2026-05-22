import { APP_INITIALIZER, Provider } from '@angular/core';
import { DbService } from './db.service';

export function initDb(dbService: DbService): () => Promise<void> {
  return () => dbService.init().then(() => undefined);
}

export const dbInitProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initDb,
  deps: [DbService],
  multi: true,
};
