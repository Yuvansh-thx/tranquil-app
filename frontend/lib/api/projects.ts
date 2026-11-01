import { api } from './client';
import { Project } from '@/types';
import { PaginatedResponse } from './tasks';

export const projectsApi = {
  getProjects: async (includeArchived = false): Promise<Project[]> => {
    const res = await api.get<PaginatedResponse<Project> | Project[]>('/projects/', {
      is_archived: includeArchived ? undefined : false,
    });
    if (Array.isArray(res)) return res;
    return res.results || [];
  },

  getProject: (id: string) => api.get<Project>(`/projects/${id}/`),

  createProject: (data: Partial<Project>) => api.post<Project>('/projects/', data),

  updateProject: (id: string, data: Partial<Project>) => api.patch<Project>(`/projects/${id}/`, data),

  deleteProject: (id: string) => api.delete(`/projects/${id}/`),

  archiveProject: (id: string) => api.post<Project>(`/projects/${id}/archive/`),
};
