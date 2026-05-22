export type CardType = 'feature' | 'task' | 'bug';

export type CardStatus = 'new' | 'active' | 'ready_to_test' | 'completed' | 'closed';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  createdBy: string;
  modifiedAt: number;
  modifiedBy: string;
}

export interface Card {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: CardType;
  status: CardStatus;
  assigneeId: string | null;
  labels: string[];
  checklist: ChecklistItem[];
  relatedCardIds: string[];
  createdAt: number;
  createdBy: string;
  modifiedAt: number;
  modifiedBy: string;
}

export interface Comment {
  id: string;
  cardId: string;
  text: string;
  createdAt: number;
  createdBy: string;
}

export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: number;
  createdBy: string;
  modifiedAt: number;
  modifiedBy: string;
}
