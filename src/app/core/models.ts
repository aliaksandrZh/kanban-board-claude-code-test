export interface BaseEntity {
  id: string;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
}

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface Project extends BaseEntity {
  name: string;
  description: string;
}

export type CardType = 'feature' | 'task' | 'bug';

export type CardStatus =
  | 'new'
  | 'active'
  | 'ready_to_test'
  | 'completed'
  | 'closed';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Card extends BaseEntity {
  projectId: string;
  title: string;
  description: string;
  type: CardType;
  status: CardStatus;
  assigneeId: string | null;
  labels: string[];
  checklist: ChecklistItem[];
  relatedCardIds: string[];
}

export interface Comment {
  id: string;
  cardId: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface WikiPage extends BaseEntity {
  projectId: string;
  title: string;
  content: string;
}
