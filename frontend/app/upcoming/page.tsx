'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { tasksApi } from '@/lib/api/tasks';
import { projectsApi } from '@/lib/api/projects';
import { Task, Project } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useQuickAdd } from '@/lib/context/QuickAddContext';

export default function UpcomingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { openQuickAdd } = useQuickAdd();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [tList, pList] = await Promise.all([
        tasksApi.getTasks({ due_after: todayStr }),
        projectsApi.getProjects(),
      ]);
      setTasks(tList);
      setProjects(pList);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

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

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Group tasks by due date
  const groups = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const d = t.due_date || 'No Date';
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(t);
  });

  const sortedDates = Array.from(groups.keys()).sort();

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            Upcoming
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-white/60">
            Preview scheduled work and maintain steady momentum.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openQuickAdd('task')}
          className="flex items-center gap-1.5 rounded-xl bg-[#4880ec] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] active:scale-[0.98] transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-xl py-16 text-center text-xs text-white/60 shadow-lg">
          No upcoming scheduled tasks.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateTasks = groups.get(dateStr) || [];
            let headerText = dateStr;
            if (dateStr !== 'No Date') {
              const d = new Date(dateStr + 'T00:00:00');
              headerText = d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
            }

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-white/15 pb-2">
                  <CalendarDays className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">
                    {headerText}
                  </span>
                  <span className="text-[11px] text-white/50">({dateTasks.length})</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {dateTasks.map((task) => {
                    const project = task.project ? projectMap.get(task.project) : undefined;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={fetchData}
                        projectName={project?.name}
                        projectColor={project?.color}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
