import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/projects', pathMatch: 'full' },
  {
    path: 'projects',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'project/:projectId',
    loadComponent: () => import('./features/project/project-shell.component').then(m => m.ProjectShellComponent),
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      {
        path: 'board',
        loadComponent: () => import('./features/kanban/board.component').then(m => m.BoardComponent),
      },
      {
        path: 'wiki',
        loadComponent: () => import('./features/wiki/wiki-list.component').then(m => m.WikiListComponent),
      },
      {
        path: 'wiki/:wikiPageId',
        loadComponent: () => import('./features/wiki/wiki-page.component').then(m => m.WikiPageComponent),
      },
    ],
  },
  {
    path: 'project/:projectId/card/:cardId',
    loadComponent: () => import('./features/card/card-detail.component').then(m => m.CardDetailComponent),
  },
  { path: '**', redirectTo: '/projects' },
];
