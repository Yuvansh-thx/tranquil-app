'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { tasksApi } from '@/lib/api/tasks';
import { projectsApi } from '@/lib/api/projects';
import { Task, Project } from '@/types';
import { TaskList } from '@/components/tasks/TaskList';

export default function InboxPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tList, pList] = await Promise.all([
        tasksApi.getTasks({ is_inbox: true }),
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

  return (
    <div className="max-w-4xl mx-auto py-2">
      <TaskList
        title="Inbox"
        description="Capture thoughts and to-dos quickly. Organize into projects whenever you're ready."
        tasks={tasks}
        projects={projects}
        onRefresh={fetchData}
        isInbox={true}
      />
    </div>
  );
}
