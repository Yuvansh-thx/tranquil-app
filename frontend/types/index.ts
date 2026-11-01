export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type NoteContentType = 'markdown' | 'checklist' | 'plain';
export type FocusSessionType = 'work' | 'short_break' | 'long_break';
export type FocusSessionStatus = 'active' | 'completed' | 'interrupted' | 'abandoned';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
}

export interface UserSettings {
  id?: string;
  timezone: string;
  pomodoro_work_mins: number;
  pomodoro_short_break_mins: number;
  pomodoro_long_break_mins: number;
  pomodoro_sessions_before_long_break: number;
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_archived: boolean;
  sort_order: number;
  task_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string | null;
  sort_order: number;
}

export interface Task {
  id: string;
  project?: string | null;
  parent_task?: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string | null;
  due_time?: string | null;
  start_date?: string | null;
  estimated_minutes?: number | null;
  actual_minutes?: number;
  completed_at?: string | null;
  is_inbox: boolean;
  sort_order: number;
  recurrence_rule?: Record<string, unknown> | null;
  tags?: Tag[];
  tag_ids?: string[];
  subtasks?: Subtask[];
  subtask_count?: number;
  is_overdue?: boolean;
  is_due_today?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NoteLink {
  id: string;
  target_note_id?: string | null;
  target_note_title?: string;
  alias?: string;
  target_title: string;
}

export interface Backlink {
  id: string;
  source_note_id: string;
  source_note_title: string;
  alias?: string;
}

export interface Note {
  id: string;
  project?: string | null;
  title: string;
  content: string;
  content_preview?: string;
  content_type: NoteContentType;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  reminder_at?: string | null;
  sort_order: number;
  tags?: Tag[];
  tag_ids?: string[];
  backlink_count?: number;
  outgoing_link_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GraphNode {
  id: string;
  title: string;
  backlink_count: number;
  outgoing_link_count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FocusSession {
  id: string;
  task?: string | null;
  task_title?: string | null;
  session_type: FocusSessionType;
  status: FocusSessionStatus;
  planned_duration_seconds: number;
  actual_duration_seconds?: number;
  started_at: string;
  ended_at?: string | null;
  session_number_in_cycle?: number;
  notes?: string;
  created_at?: string;
}

export interface ActiveSessionInfo {
  id: string;
  session_type: FocusSessionType;
  planned_duration_seconds: number;
  elapsed_seconds: number;
  task_title?: string | null;
}

export interface AnalyticsOverview {
  tasks_due_today: number;
  tasks_overdue: number;
  tasks_completed_today: number;
  tasks_completed_this_week: number;
  focus_sessions_today: number;
  focus_minutes_today: number;
  active_session?: ActiveSessionInfo | null;
}

export interface TaskAnalyticsItem {
  date: string;
  count: number;
}

export interface PriorityDistribution {
  priority: Priority;
  count: number;
}

export interface TaskAnalytics {
  daily: TaskAnalyticsItem[];
  by_priority: PriorityDistribution[];
  total_completed_period: number;
  total_open: number;
  total_overdue: number;
  days: number;
}

export interface FocusAnalyticsItem {
  date: string;
  minutes: number;
  sessions: number;
}

export interface FocusAnalytics {
  daily: FocusAnalyticsItem[];
  total_minutes_period: number;
  total_sessions_period: number;
  avg_minutes_per_day: number;
  completion_rate: number;
  days: number;
}

export interface DailyActivityRecord {
  date: string;
  tasks_completed: number;
  focus_hours: number;
  focus_minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivitySummary {
  total_focus_hours: number;
  total_tasks_completed: number;
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  days_count: number;
}

export interface ActivityAnalyticsResponse {
  daily: DailyActivityRecord[];
  summary: ActivitySummary;
}

export interface SearchTaskResult {
  id: string;
  type: 'task';
  title: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string | null;
  project_name?: string | null;
}

export interface SearchNoteResult {
  id: string;
  type: 'note';
  title: string;
  content_preview: string;
  color: string;
  is_pinned: boolean;
}

export interface SearchResults {
  query: string;
  tasks: SearchTaskResult[];
  notes: SearchNoteResult[];
}
