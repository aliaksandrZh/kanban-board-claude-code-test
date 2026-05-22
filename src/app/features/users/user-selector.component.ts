import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/users.service';
import { AppStore } from '../../stores/app.store';

@Component({
  selector: 'app-user-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-selector">
      <select
        [ngModel]="appStore.currentUserId()"
        (ngModelChange)="onUserChange($event)"
      >
        <option [value]="null">-- select user --</option>
        @for (user of usersService.users(); track user.id) {
          <option [value]="user.id">{{ user.name }}</option>
        }
      </select>
      <button (click)="showCreate = true" *ngIf="!showCreate">+ User</button>
      @if (showCreate) {
        <div class="create-user">
          <input
            type="text"
            placeholder="Username"
            [(ngModel)]="newUserName"
            (keyup.enter)="createUser()"
          />
          <button (click)="createUser()">Create</button>
          <button (click)="showCreate = false">Cancel</button>
        </div>
      }
    </div>
  `,
  styles: `
    .user-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    select {
      padding: 0.4rem 0.6rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: #fff;
      font-size: 0.875rem;
    }
    button {
      padding: 0.4rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: #fff;
      cursor: pointer;
      font-size: 0.875rem;
      &:hover {
        background: #f9fafb;
      }
    }
    .create-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      input {
        padding: 0.4rem 0.6rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }
    }
  `,
})
export class UserSelectorComponent {
  usersService = inject(UsersService);
  appStore = inject(AppStore);

  showCreate = false;
  newUserName = '';

  onUserChange(userId: string | null): void {
    this.appStore.setCurrentUser(userId);
  }

  async createUser(): Promise<void> {
    if (!this.newUserName.trim()) return;
    await this.usersService.createUser(this.newUserName.trim());
    this.newUserName = '';
    this.showCreate = false;
  }
}
