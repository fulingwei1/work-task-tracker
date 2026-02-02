// Frontend types matching API responses and Prisma schema

export type UserRole = "STAFF" | "MANAGER" | "DIRECTOR" | "CEO" | "ADMIN";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "COMPLETED" | "BLOCKED" | "CANCELLED";
export type TaskPriority = "P1" | "P2" | "P3";
export type TaskSource = "MANUAL" | "MEETING" | "PLAN";

// User types
export interface UserBasic {
  id: string;
  name: string;
  departmentId?: string | null;
}

export interface User extends UserBasic {
  wxUserId?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Department types
export interface Department {
  id: string;
  wxDeptId?: string | null;
  name: string;
  parentId?: string | null;
  children?: Department[];
}

// Task types
export interface TaskOwner {
  id: string;
  name: string;
  departmentId?: string | null;
}

export interface TaskCreator {
  id: string;
  name: string;
}

export interface TaskListItem {
  id: string;
  title: string;
  ownerId: string;
  owner: TaskOwner;
  collaboratorIds: string[];
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  acceptanceCriteria?: string | null;
  source: TaskSource;
  createdBy: string;
  creator: TaskCreator;
  createdAt: string;
  updatedAt: string;
  latestProgress: number | null;
  latestUpdateAt: string | null;
}

export interface TaskUpdateUser {
  id: string;
  name: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  userId: string;
  user: TaskUpdateUser;
  progressPercent: number;
  status: TaskStatus | null;
  blockerType: string | null;
  blockerDesc: string | null;
  nextAction: string | null;
  estimatedCompletion: string | null;
  createdAt: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  ownerId: string;
  owner: TaskOwner;
  collaboratorIds: string[];
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  acceptanceCriteria: string | null;
  source: TaskSource;
  createdBy: string;
  creator: TaskCreator;
  createdAt: string;
  updatedAt: string;
  updates: TaskUpdate[];
}

// API response types
export interface ApiListMeta {
  total: number;
  page: number;
  limit: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ApiListMeta;
}

export interface ApiSingleResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

// Task form types
export interface TaskFormData {
  title: string;
  ownerId: string;
  collaboratorIds: string[];
  dueDate: string | null;
  priority: TaskPriority;
  acceptanceCriteria: string | null;
}

export interface ProgressUpdateFormData {
  progressPercent: number;
  status?: TaskStatus;
  blockerType?: string;
  blockerDesc?: string;
  nextAction?: string;
  estimatedCompletion?: string;
}

// Dashboard stats
export interface DashboardStats {
  pending: number;
  inProgress: number;
  dueSoon: number;
  overdue: number;
}
