import { api } from './client';
import {
  AnalyticsOverview,
  TaskAnalytics,
  FocusAnalytics,
  ActivityAnalyticsResponse,
} from '@/types';

export const analyticsApi = {
  getOverview: () => api.get<AnalyticsOverview>('/analytics/overview/'),
  getTaskAnalytics: (days = 14) => api.get<TaskAnalytics>('/analytics/tasks/', { days }),
  getFocusAnalytics: (days = 14) => api.get<FocusAnalytics>('/analytics/focus/', { days }),
  getActivityAnalytics: (days = 365) =>
    api.get<ActivityAnalyticsResponse>('/analytics/activity/', { days }),
};
