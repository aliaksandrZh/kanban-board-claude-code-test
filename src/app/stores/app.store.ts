import { Injectable, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import { DbService } from '../core/db.service';
import { User } from '../core/models';

interface AppState {
  currentUserId: string | null;
}

const initialState: AppState = {
  currentUserId: 'root',
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setCurrentUser(userId: string | null): void {
      patchState(store, () => ({ currentUserId: userId }));
    },
  }))
);
