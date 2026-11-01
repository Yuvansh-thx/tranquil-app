import { api } from './client';
import { Tag } from '@/types';
import { PaginatedResponse } from './tasks';

export const tagsApi = {
  getTags: async (): Promise<Tag[]> => {
    const res = await api.get<PaginatedResponse<Tag> | Tag[]>('/tags/');
    if (Array.isArray(res)) return res;
    return res.results || [];
  },

  createTag: (data: Partial<Tag>) => api.post<Tag>('/tags/', data),

  deleteTag: (id: string) => api.delete(`/tags/${id}/`),
};
