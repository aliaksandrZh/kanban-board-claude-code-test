import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProjectComponent } from './features/project/project.component';
import { KanbanComponent } from './features/kanban/kanban.component';
import { CardDetailComponent } from './features/card/card-detail.component';
import { WikiListComponent } from './features/wiki/wiki-list.component';
import { WikiPageComponent } from './features/wiki/wiki-page.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'projects', component: DashboardComponent },
  {
    path: 'project/:projectId',
    component: ProjectComponent,
    children: [
      { path: '', component: KanbanComponent },
      { path: 'card/:cardId', component: CardDetailComponent },
      { path: 'wiki', component: WikiListComponent },
      { path: 'wiki/:wikiPageId', component: WikiPageComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
