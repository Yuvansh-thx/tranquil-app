import { api } from './client';
import { FocusSession, FocusSessionType } from '@/types';
import { PaginatedResponse } from './tasks';

export interface StartSessionPayload {
  session_type: FocusSessionType;
  planned_duration_seconds: number;
  task?: string | null;
  notes?: string;
  session_number_in_cycle?: number;
}

export const focusApi = {
  getSessions: async (): Promise<FocusSession[]> => {
    const res = await api.get<PaginatedResponse<FocusSession> | FocusSession[]>('/focus/sessions/');
    if (Array.isArray(res)) return res;
    return res.results || [];
  },

  getActiveSession: () => api.get<FocusSession | null>('/focus/sessions/active/'),

  startSession: (data: StartSessionPayload) =>
    api.post<FocusSession>('/focus/sessions/start/', data),

  completeSession: (id: string) =>
    api.post<FocusSession>(`/focus/sessions/${id}/complete/`),

  interruptSession: (id: string) =>
    api.post<FocusSession>(`/focus/sessions/${id}/interrupt/`),
};
