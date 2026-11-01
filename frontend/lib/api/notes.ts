import { api } from './client';
import { Note, Backlink, NoteLink, GraphData } from '@/types';
import { PaginatedResponse } from './tasks';

export interface NoteFilterParams {
  color?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  project?: string;
  tag?: string;
  search?: string;
  ordering?: string;
}

export interface NoteSuggestion {
  id: string;
  title: string;
}

export const notesApi = {
  getNotes: async (params?: NoteFilterParams): Promise<Note[]> => {
    const res = await api.get<PaginatedResponse<Note> | Note[]>('/notes/', params as Record<string, string | number | boolean>);
    if (Array.isArray(res)) return res;
    return res.results || [];
  },

  getNote: (id: string) => api.get<Note>(`/notes/${id}/`),

  createNote: (data: Partial<Note> & { tag_ids?: string[] }) =>
    api.post<Note>('/notes/', data),

  updateNote: (id: string, data: Partial<Note> & { tag_ids?: string[] }) =>
    api.patch<Note>(`/notes/${id}/`, data),

  deleteNote: (id: string) => api.delete(`/notes/${id}/`),

  pinNote: (id: string) => api.post<{ is_pinned: boolean }>(`/notes/${id}/pin/`),

  archiveNote: (id: string) => api.post<{ status: string }>(`/notes/${id}/archive/`),

  restoreNote: (id: string) => api.post<{ status: string }>(`/notes/${id}/restore/`),

  duplicateNote: (id: string) => api.post<Note>(`/notes/${id}/duplicate/`),

  getBacklinks: (id: string) => api.get<Backlink[]>(`/notes/${id}/backlinks/`),

  getLinks: (id: string) => api.get<NoteLink[]>(`/notes/${id}/links/`),

  getGraph: () => api.get<GraphData>('/notes/graph/'),

  getSuggestions: (q: string) => api.get<NoteSuggestion[]>('/notes/suggestions/', { q }),

  linkNote: (sourceId: string, targetNoteId?: string | null, targetTitle?: string) =>
    api.post<Note>(`/notes/${sourceId}/link/`, { target_note_id: targetNoteId, target_title: targetTitle }),

  unlinkNote: (sourceId: string, targetNoteId?: string | null, targetTitle?: string) =>
    api.post<Note>(`/notes/${sourceId}/unlink/`, { target_note_id: targetNoteId, target_title: targetTitle }),

  connectNotes: (sourceId: string, targetId: string) =>
    api.post<{ status: string; source_id: string; target_id: string }>('/notes/connect/', { source_id: sourceId, target_id: targetId }),
};
