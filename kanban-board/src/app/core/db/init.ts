import { APP_INITIALIZER } from '@angular/core';
import { AppStore } from '../stores/app.store';

export function initAppFactory(appStore: AppStore) {
  return () => appStore.createDefaultUser();
}

export const appInitProvider = {
  provide: APP_INITIALIZER,
  useFactory: initAppFactory,
  deps: [AppStore],
  multi: true,
};
