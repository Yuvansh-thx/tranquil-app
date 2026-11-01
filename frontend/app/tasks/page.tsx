'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Search, CheckSquare, Plus } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { tasksApi, TaskFilterParams } from '@/lib/api/tasks';
import { projectsApi } from '@/lib/api/projects';
import { Task, Project, Priority, TaskStatus } from '@/types';
import { TaskList } from '@/components/tasks/TaskList';
import { useQuickAdd } from '@/lib/context/QuickAddContext';

export default function AllTasksPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { openQuickAdd } = useQuickAdd();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params: TaskFilterParams = {};
      if (statusFilter !== 'all') params.status = statusFilter as TaskStatus;
      if (priorityFilter !== 'all') params.priority = priorityFilter as Priority;
      if (projectFilter !== 'all') params.project = projectFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [tList, pList] = await Promise.all([
        tasksApi.getTasks(params),
        projectsApi.getProjects(),
      ]);
      setTasks(tList);
      setProjects(pList);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, projectFilter, searchQuery]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, isLoading, router, fetchData]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener('tranquil:refresh', handleRefresh);
    return () => window.removeEventListener('tranquil:refresh', handleRefresh);
  }, [fetchData]);

  if (isLoading || (loading && !user)) {
    return (
      <div className="flex h-64 items-center justify-center text-white/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/20 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 text-xs text-white/90 shadow-sm focus:outline-none focus:border-blue-400"
          >
            <option value="all" className="bg-slate-900 text-white">All Statuses</option>
            <option value="todo" className="bg-slate-900 text-white">To Do</option>
            <option value="in_progress" className="bg-slate-900 text-white">In Progress</option>
            <option value="done" className="bg-slate-900 text-white">Completed</option>
            <option value="archived" className="bg-slate-900 text-white">Archived</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-white/20 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 text-xs text-white/90 shadow-sm focus:outline-none focus:border-blue-400"
          >
            <option value="all" className="bg-slate-900 text-white">All Priorities</option>
            <option value="urgent" className="bg-slate-900 text-white">Urgent (P1)</option>
            <option value="high" className="bg-slate-900 text-white">High (P2)</option>
            <option value="medium" className="bg-slate-900 text-white">Medium (P3)</option>
            <option value="low" className="bg-slate-900 text-white">Low (P4)</option>
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-xl border border-white/20 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 text-xs text-white/90 shadow-sm focus:outline-none focus:border-blue-400"
          >
            <option value="all" className="bg-slate-900 text-white">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-sky-300" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 shadow-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <TaskList
        title="All Tasks"
        description="Filter by project, priority, or search keywords across all your commitments."
        tasks={tasks}
        projects={projects}
        onRefresh={fetchData}
      />
    </div>
  );
}
