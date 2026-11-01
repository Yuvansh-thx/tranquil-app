'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { tasksApi } from '@/lib/api/tasks';
import { projectsApi } from '@/lib/api/projects';
import { Task, Project } from '@/types';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskCard } from '@/components/tasks/TaskCard';

export default function TodayPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    try {
      const [dueToday, overdue, pList] = await Promise.all([
        tasksApi.getTasks({ due_today: true }),
        tasksApi.getTasks({ overdue: true }),
        projectsApi.getProjects(),
      ]);

      // Combine unique tasks
      const map = new Map<string, Task>();
      overdue.forEach((t) => map.set(t.id, t));
      dueToday.forEach((t) => map.set(t.id, t));

      setTasks(Array.from(map.values()));
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

  const overdueTasks = tasks.filter((t) => t.is_overdue && t.status !== 'done');
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Overdue Alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/40 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <span>Overdue Tasks ({overdueTasks.length})</span>
          </div>
          <div className="space-y-1.5">
            {overdueTasks.map((task) => {
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
      )}

      <TaskList
        title="Today"
        description={new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        tasks={tasks.filter((t) => !t.is_overdue || t.status === 'done')}
        projects={projects}
        onRefresh={fetchData}
        defaultDueDate={todayStr}
      />
    </div>
  );
}
