'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Inbox,
  Check,
  CheckCircle2,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  ListTodo,
  GripVertical,
  Timer,
  Trash2,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useFocus } from '@/lib/context/FocusContext';
import { tasksApi } from '@/lib/api/tasks';
import { notesApi } from '@/lib/api/notes';
import { projectsApi } from '@/lib/api/projects';
import { Task, Note, Project } from '@/types';
import { AnalogClockWidget } from '@/components/dashboard/AnalogClockWidget';
import { MiniCalendarWidget } from '@/components/dashboard/MiniCalendarWidget';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { startFocus } = useFocus();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filter matching screenshot: 'unplanned' | 'planned' | 'all' | 'date'
  const [activeFilter, setActiveFilter] = useState<'unplanned' | 'planned' | 'all' | 'date'>('unplanned');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Quick todo input
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [submittingTodo, setSubmittingTodo] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Collapsible sections state
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    unplanned: false,
    withoutProject: false,
    todos: true,
    scheduled: true,
    done: true,
  });

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, projectsData, notesData] = await Promise.all([
        tasksApi.getTasks().catch(() => []),
        projectsApi.getProjects().catch(() => []),
        notesApi.getNotes({ is_pinned: true }).catch(() => []),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
      setNotes(notesData);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener('tranquil:refresh', handleRefresh);
    return () => window.removeEventListener('tranquil:refresh', handleRefresh);
  }, [fetchData]);

  // Quick task creation on enter or button click
  const handleCreateTodo = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const title = newTodoTitle.trim();
    if (!title || submittingTodo) return;
    setSubmittingTodo(true);
    setCreateError(null);
    try {
      const dueDate = selectedCalendarDate
        ? selectedCalendarDate.toISOString().split('T')[0]
        : undefined;

      const newTask = await tasksApi.createTask({
        title,
        priority: 'medium',
        status: 'todo',
        due_date: dueDate,
      });

      setTasks((prev) => [newTask, ...prev]);
      setNewTodoTitle('');

      // Auto expand the relevant group so user immediately sees the newly added item
      setCollapsed((prev) => ({
        ...prev,
        unplanned: false,
        todos: false,
        scheduled: dueDate ? false : prev.scheduled,
      }));

      window.dispatchEvent(new CustomEvent('tranquil:refresh'));
    } catch (err: unknown) {
      console.error('Failed to create task:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create task. Please try again.';
      setCreateError(msg);
    } finally {
      setSubmittingTodo(false);
    }
  };

  // Toggle complete with confetti celebration
  const handleToggleTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (task.status === 'done') {
        const updated = await tasksApi.reopenTask(task.id);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      } else {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
          },
        });
        const updated = await tasksApi.completeTask(task.id);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tasksApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // Ignore
    }
  };

  // Partition tasks into sections
  const unplannedTasks = useMemo(() => {
    return tasks.filter((t) => !t.due_date && t.status !== 'done');
  }, [tasks]);

  const plannedTasks = useMemo(() => {
    return tasks.filter((t) => !!t.due_date && t.status !== 'done');
  }, [tasks]);

  const doneTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'done');
  }, [tasks]);

  const todoTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'done');
  }, [tasks]);

  const tasksWithoutProject = useMemo(() => {
    return tasks.filter((t) => !t.project && t.status !== 'done');
  }, [tasks]);

  const renderTaskRow = (task: Task) => (
    <div
      key={task.id}
      className="group relative flex items-center justify-between rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 p-3.5 shadow-sm backdrop-blur-xl hover:shadow-md hover:bg-white/95 dark:hover:bg-slate-900/85 transition"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Drag 6-dot handle matching screenshot */}
        <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0 cursor-grab" />

        {/* Tick Mark Button to mark as done */}
        <button
          type="button"
          onClick={(e) => handleToggleTask(task, e)}
          title="Mark as done"
          className="group/check relative flex h-6 w-6 items-center justify-center rounded-xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-800/80 text-transparent hover:text-emerald-500 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-all shadow-2xs flex-shrink-0 cursor-pointer"
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5] opacity-0 scale-75 group-hover/check:opacity-100 group-hover/check:scale-100 text-emerald-500 transition-all" />
        </button>

        {/* Task Title */}
        <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {task.title}
        </span>

        {/* Due date badge if present */}
        {task.due_date && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-950/50 border border-sky-200/50 dark:border-sky-800/50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400 flex-shrink-0">
            <CalendarIcon className="h-3 w-3" />
            {task.due_date}
          </span>
        )}
      </div>

      {/* Quick action buttons on hover */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => startFocus(task.id, task.title)}
          title="Focus with Pomodoro"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 transition cursor-pointer"
        >
          <Timer className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => handleDeleteTask(task.id, e)}
          title="Delete Todo"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // Active dates for the calendar dots
  const activeDates = useMemo(() => {
    return tasks
      .filter((t) => !!t.due_date && t.status !== 'done')
      .map((t) => t.due_date as string);
  }, [tasks]);

  // Filter tasks based on left Planner selection
  const displayedTasks = useMemo(() => {
    if (activeFilter === 'unplanned') {
      return unplannedTasks;
    }
    if (activeFilter === 'planned') {
      return plannedTasks;
    }
    if (activeFilter === 'date' && selectedCalendarDate) {
      const dateStr = selectedCalendarDate.toISOString().split('T')[0];
      return tasks.filter((t) => t.due_date === dateStr);
    }
    return tasks.filter((t) => t.status !== 'done');
  }, [activeFilter, unplannedTasks, plannedTasks, tasks, selectedCalendarDate]);

  if (authLoading || (loading && !user)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-white/60">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-400 border-t-transparent" />
          <p className="text-xs font-semibold">Opening Planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top subtle workspace context */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">Workspace</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>
        <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Tranquil Workspace
        </div>
      </div>

      {/* Main Two-Column Layout from Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            COLUMN 1: PLANNER (Filters, Analog Clock, and Calendar)
            ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Planner
            </h1>
          </div>

          {/* Navigation Filter Cards matching screenshot */}
          <div className="space-y-2.5">
            {/* Unplanned Card */}
            <div
              onClick={() => {
                setActiveFilter('unplanned');
                setSelectedCalendarDate(null);
              }}
              className={`rounded-2xl border p-4 shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 backdrop-blur-xl ${
                activeFilter === 'unplanned'
                  ? 'border-white/80 dark:border-white/20 bg-white/90 dark:bg-slate-900/80 shadow-md scale-[1.01]'
                  : 'border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:bg-white/85 dark:hover:bg-slate-900/75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Inbox className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Unplanned
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {unplannedTasks.length}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Planned Card */}
            <div
              onClick={() => {
                setActiveFilter('planned');
                setSelectedCalendarDate(null);
              }}
              className={`rounded-2xl border p-4 shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 backdrop-blur-xl ${
                activeFilter === 'planned'
                  ? 'border-white/80 dark:border-white/20 bg-white/90 dark:bg-slate-900/80 shadow-md scale-[1.01]'
                  : 'border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:bg-white/85 dark:hover:bg-slate-900/75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Planned
                </span>
              </div>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {plannedTasks.length}
              </span>
            </div>

            {/* All Card */}
            <div
              onClick={() => {
                setActiveFilter('all');
                setSelectedCalendarDate(null);
              }}
              className={`rounded-2xl border p-4 shadow-sm flex items-center justify-between cursor-pointer transition-all duration-200 backdrop-blur-xl ${
                activeFilter === 'all'
                  ? 'border-white/80 dark:border-white/20 bg-white/90 dark:bg-slate-900/80 shadow-md scale-[1.01]'
                  : 'border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:bg-white/85 dark:hover:bg-slate-900/75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  All
                </span>
              </div>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {tasks.length}
              </span>
            </div>
          </div>

          {/* Analog Clock & Live Date Widget Card from screenshot */}
          <AnalogClockWidget />

          {/* Interactive Mini Calendar Widget Card from screenshot */}
          <MiniCalendarWidget
            selectedDate={selectedCalendarDate}
            activeDates={activeDates}
            onSelectDate={(d) => {
              setSelectedCalendarDate(d);
              setActiveFilter('date');
            }}
          />
        </div>

        {/* =========================================================================
            COLUMN 2: TODO'S (Quick Add, Collapsible Groups, Task Cards)
            ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Todo&apos;s
            </h2>
          </div>

          {/* Subheader / Active Filter View matching screenshot */}
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 px-1">
            <ListTodo className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span>
              {activeFilter === 'unplanned' && 'ToDo Unplanned'}
              {activeFilter === 'planned' && 'ToDo Planned'}
              {activeFilter === 'all' && 'All ToDos'}
              {activeFilter === 'date' && selectedCalendarDate && `ToDo ${selectedCalendarDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
          </div>

          {/* Quick Add Bar: "+ Add todo, press ↵ Enter" matching screenshot */}
          <form onSubmit={handleCreateTodo} className="relative">
            <div className="flex items-center rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
              <Plus className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Add todo, press ↵ Enter"
                value={newTodoTitle}
                onChange={(e) => {
                  setNewTodoTitle(e.target.value);
                  if (createError) setCreateError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTodo(e);
                  }
                }}
                disabled={submittingTodo}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTodoTitle.trim() || submittingTodo}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/15 bg-slate-100 dark:bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 ml-2 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800/90 transition-all cursor-pointer flex-shrink-0"
                title="Add Todo (Enter)"
              >
                {submittingTodo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-xs font-bold leading-none">↵</span>
                    <span className="text-[11px] font-semibold leading-none">Enter</span>
                  </>
                )}
              </button>
            </div>
            {createError && (
              <p className="mt-1.5 px-2 text-xs font-medium text-rose-500 dark:text-rose-400">
                {createError}
              </p>
            )}
          </form>

          {/* Collapsible Sections Container */}
          <div className="space-y-4">
            {/* 1. Unplanned Group matching screenshot */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSection('unplanned')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition px-1 cursor-pointer"
              >
                {collapsed.unplanned ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
                <span>Unplanned</span>
                <span className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {unplannedTasks.length}
                </span>
              </button>

              {!collapsed.unplanned && (
                <div className="space-y-2 pl-1">
                  {unplannedTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300/60 dark:border-slate-800 p-4 text-center text-xs text-slate-400 italic">
                      No unplanned todos. Add one above!
                    </div>
                  ) : (
                    unplannedTasks.map((task) => renderTaskRow(task))
                  )}
                </div>
              )}
            </div>

            {/* 2. Without Project Group matching screenshot */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                Without Project
              </span>
            </div>

            {/* 3. Todo's Group matching screenshot */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSection('todos')}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition px-1 cursor-pointer"
              >
                {collapsed.todos ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
                <span>Todo&apos;s</span>
                <span className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {todoTasks.length}
                </span>
              </button>

              {!collapsed.todos && (
                <div className="space-y-2 pl-1">
                  {todoTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300/60 dark:border-slate-800 p-4 text-center text-xs text-slate-400 italic">
                      No active todos.
                    </div>
                  ) : (
                    todoTasks.map((task) => renderTaskRow(task))
                  )}
                </div>
              )}
            </div>

            {/* 4. Scheduled Group matching screenshot */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSection('scheduled')}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition px-1 cursor-pointer"
              >
                {collapsed.scheduled ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
                <span>Scheduled</span>
                <span className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {plannedTasks.length}
                </span>
              </button>

              {!collapsed.scheduled && (
                <div className="space-y-2 pl-1">
                  {plannedTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300/60 dark:border-slate-800 p-4 text-center text-xs text-slate-400 italic">
                      No scheduled todos.
                    </div>
                  ) : (
                    plannedTasks.map((task) => renderTaskRow(task))
                  )}
                </div>
              )}
            </div>

            {/* 5. Done Group matching screenshot */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSection('done')}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition px-1 cursor-pointer"
              >
                {collapsed.done ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
                <span>Done</span>
                <span className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {doneTasks.length}
                </span>
              </button>

              {!collapsed.done && (
                <div className="space-y-2 pl-1">
                  {doneTasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300/60 dark:border-slate-800 p-4 text-center text-xs text-slate-400 italic">
                      No completed todos yet.
                    </div>
                  ) : (
                    doneTasks.map((task) => (
                      <div
                        key={task.id}
                        className="group relative flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-3 opacity-60 backdrop-blur-md hover:opacity-100 transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => handleToggleTask(task, e)}
                            title="Mark as incomplete"
                            className="flex h-6 w-6 items-center justify-center rounded-xl border border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/25 shadow-md flex-shrink-0 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                          <span className="line-through text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                            {task.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          title="Delete Todo"
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
