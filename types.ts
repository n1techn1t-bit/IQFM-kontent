
export enum IdeaStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  CHANGES_REQUIRED = 'CHANGES_REQUIRED',
  REJECTED = 'REJECTED'
}

export enum IdeaVariant {
  TOPIC = 'TOPIC',
  POST = 'POST'
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  NEEDS_REVISION = 'NEEDS_REVISION'
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  tags: string[];
  createdAt: number;
  comments: Comment[];
  variant: IdeaVariant;
  order?: number; // For manual sorting
}

export interface Post {
  id: string;
  ideaId?: string;
  caption: string;
  mediaUrl: string; // URL to image/video
  status: PostStatus;
  scheduledDate?: number; // Timestamp
  tags: string[];
  createdAt: number;
  updatedAt: number;
  comments: Comment[];
  version: number;
}

export enum UserRole {
  ADMIN = 'ADMIN', // Creator
  CLIENT = 'CLIENT' // Client
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
}

export const MOCK_USER_ADMIN: User = {
  id: 'admin_1',
  name: 'Kreator (Ty)',
  role: UserRole.ADMIN,
  avatarUrl: 'https://ui-avatars.com/api/?name=Kreator&background=0D8ABC&color=fff'
};

export const MOCK_USER_CLIENT: User = {
  id: 'client_1',
  name: 'Klient',
  role: UserRole.CLIENT,
  avatarUrl: 'https://ui-avatars.com/api/?name=Klient&background=6366f1&color=fff'
};
