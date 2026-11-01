import { api } from './client';
import { SearchResults } from '@/types';

export const searchApi = {
  search: (q: string, type: 'all' | 'tasks' | 'notes' = 'all', limit = 15) =>
    api.get<SearchResults>('/search/', { q, type, limit }),
};
