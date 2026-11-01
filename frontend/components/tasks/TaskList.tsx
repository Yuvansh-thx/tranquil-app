'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2, Flag, Calendar, Sparkles } from 'lucide-react';
import { Task, Project } from '@/types';
import { TaskCard } from './TaskCard';
import { tasksApi } from '@/lib/api/tasks';

interface TaskListProps {
  tasks: Task[];
  projects?: Project[];
  onRefresh: () => void;
  defaultProjectId?: string;
  defaultDueDate?: string;
  isInbox?: boolean;
  title?: string;
  description?: string;
}

export function TaskList({
  tasks,
  projects = [],
  onRefresh,
  defaultProjectId,
  defaultDueDate,
  isInbox = false,
  title,
  description,
}: TaskListProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setLoading(true);
    try {
      await tasksApi.createTask({
        title: quickTitle.trim(),
        project: defaultProjectId || undefined,
        due_date: defaultDueDate || undefined,
        is_inbox: isInbox,
        priority: 'medium',
      });
      setQuickTitle('');
      onRefresh();
      window.dispatchEvent(new CustomEvent('tranquil:refresh'));
    } catch (err) {
      console.error('Failed to quick add task:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-xs sm:text-sm text-white/60">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-sky-200 border border-white/15 shadow-sm">
            <span>{activeTasks.length}</span>
            <span className="font-normal text-white/50">remaining</span>
          </div>
        </div>
      )}

      {/* Inline Quick Add matching screenshot */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2.5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 backdrop-blur-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20"
      >
        <Plus className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Add todo, press ↵ Enter"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
        <kbd className="hidden sm:inline-flex items-center rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          ↵ Enter
        </kbd>
        {quickTitle.trim() && (
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#4880ec] px-3.5 py-1 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] active:scale-[0.98] transition"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        )}
      </form>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-xl py-16 px-4 text-center shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 border border-blue-400/30 text-sky-300 shadow-inner">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-white">
            All clear!
          </h3>
          <p className="mt-1 text-xs text-white/60 max-w-xs">
            No tasks here right now. Enjoy your calm headspace or capture a new idea.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Active tasks */}
          {activeTasks.map((task) => {
            const project = task.project ? projectMap.get(task.project) : undefined;
            return (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onRefresh}
                projectName={project?.name}
                projectColor={project?.color}
              />
            );
          })}

          {/* Completed tasks accordion */}
          {completedTasks.length > 0 && (
            <div className="pt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                Completed ({completedTasks.length})
              </div>
              <div className="space-y-2 opacity-80">
                {completedTasks.map((task) => {
                  const project = task.project ? projectMap.get(task.project) : undefined;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={onRefresh}
                      projectName={project?.name}
                      projectColor={project?.color}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
