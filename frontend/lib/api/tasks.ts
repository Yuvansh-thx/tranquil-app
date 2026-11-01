import { api } from './client';
import { Task, Priority, TaskStatus } from '@/types';

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: Priority;
  project?: string;
  no_project?: boolean;
  due_today?: boolean;
  overdue?: boolean;
  due_before?: string;
  due_after?: string;
  is_inbox?: boolean;
  parent_task?: string;
  no_parent?: boolean;
  tag?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const tasksApi = {
  getTasks: async (params?: TaskFilterParams): Promise<Task[]> => {
    const res = await api.get<PaginatedResponse<Task> | Task[]>('/tasks/', params as Record<string, string | number | boolean>);
    if (Array.isArray(res)) return res;
    return res.results || [];
  },

  getTask: (id: string) => api.get<Task>(`/tasks/${id}/`),

  createTask: (data: Partial<Task> & { tag_ids?: string[] }) =>
    api.post<Task>('/tasks/', data),

  updateTask: (id: string, data: Partial<Task> & { tag_ids?: string[] }) =>
    api.patch<Task>(`/tasks/${id}/`, data),

  deleteTask: (id: string) => api.delete(`/tasks/${id}/`),

  completeTask: (id: string) => api.post<Task>(`/tasks/${id}/complete/`),

  reopenTask: (id: string) => api.post<Task>(`/tasks/${id}/reopen/`),

  archiveTask: (id: string) => api.post<Task>(`/tasks/${id}/archive/`),
};
