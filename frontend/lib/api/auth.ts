import { api } from './client';
import { User, UserSettings } from '@/types';

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  user: User;
  detail?: string;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<AuthResponse>('/auth/login/', data),
  register: (data: RegisterPayload) => api.post<AuthResponse>('/auth/register/', data),
  logout: () => api.post<{ detail: string }>('/auth/logout/'),
  me: () => api.get<User>('/auth/me/'),
  getSettings: () => api.get<UserSettings>('/auth/settings/'),
  updateSettings: (data: Partial<UserSettings>) => api.patch<UserSettings>('/auth/settings/', data),
  changePassword: (data: { old_password?: string; new_password?: string }) =>
    api.post<{ detail: string }>('/auth/change-password/', data),
};
