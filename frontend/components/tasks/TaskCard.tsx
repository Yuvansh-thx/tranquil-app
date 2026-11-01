'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Clock,
  Flag,
  Calendar,
  Timer,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
} from 'lucide-react';
import { Task, Subtask, Priority } from '@/types';
import { tasksApi } from '@/lib/api/tasks';
import { useFocus } from '@/lib/context/FocusContext';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  projectName?: string;
  projectColor?: string;
}

export function TaskCard({ task, onUpdate, projectName, projectColor }: TaskCardProps) {
  const { startFocus } = useFocus();

  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const priorityConfig: Record<Priority, { label: string; text: string; bg: string; iconColor: string }> = {
    urgent: { label: 'P1', text: 'Urgent', bg: 'bg-rose-500/20 border-rose-400/40 text-rose-200', iconColor: 'text-rose-400' },
    high: { label: 'P2', text: 'High', bg: 'bg-amber-500/20 border-amber-400/40 text-amber-200', iconColor: 'text-amber-400' },
    medium: { label: 'P3', text: 'Medium', bg: 'bg-blue-500/20 border-blue-400/40 text-sky-200', iconColor: 'text-sky-400' },
    low: { label: 'P4', text: 'Low', bg: 'bg-white/10 border-white/20 text-white/70', iconColor: 'text-white/60' },
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    try {
      if (task.status === 'done') {
        await tasksApi.reopenTask(task.id);
      } else {
        confetti({
          particleCount: 40,
          spread: 45,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
          },
        });
        await tasksApi.completeTask(task.id);
      }
      onUpdate();
    } catch {
      // Ignore
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tasksApi.deleteTask(task.id);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubmittingSubtask(true);
    try {
      await tasksApi.createTask({
        title: newSubtaskTitle.trim(),
        parent_task: task.id,
        status: 'todo',
        priority: task.priority,
      });
      setNewSubtaskTitle('');
      onUpdate();
    } catch {
      // Ignore
    } finally {
      setSubmittingSubtask(false);
    }
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    try {
      if (sub.status === 'done') {
        await tasksApi.reopenTask(sub.id);
      } else {
        await tasksApi.completeTask(sub.id);
      }
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    startFocus(task.id, task.title);
  };

  const pConfig = priorityConfig[task.priority] || priorityConfig.medium;
  const isDone = task.status === 'done';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 backdrop-blur-xl ${
        isDone
          ? 'border-slate-200/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/30 opacity-60 shadow-sm'
          : 'border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 hover:bg-white/95 dark:hover:bg-slate-900/85 hover:shadow-md shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag Grip Handle matching screenshot */}
        <GripVertical className="mt-1 h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0 cursor-grab" />

        {/* Tick Mark Button to mark as done */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isCompleting}
          title={isDone ? 'Mark as incomplete' : 'Mark as done'}
          className={`group/check relative flex h-6 w-6 items-center justify-center rounded-xl border transition-all duration-200 shadow-2xs flex-shrink-0 mt-0.5 ${
            isDone
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/25 shadow-md'
              : 'border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-800/80 text-transparent hover:text-emerald-500 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40'
          }`}
        >
          <Check
            className={`h-3.5 w-3.5 stroke-[2.5] transition-all ${
              isDone
                ? 'scale-100 opacity-100 text-white'
                : 'opacity-0 scale-75 group-hover/check:opacity-100 group-hover/check:scale-100 text-emerald-500'
            }`}
          />
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-semibold leading-snug break-words ${
                isDone
                  ? 'line-through text-slate-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h4>

            {/* Quick Actions (Hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {!isDone && (
                <button
                  type="button"
                  onClick={handleStartFocus}
                  title="Focus on this task with Pomodoro"
                  className="flex items-center gap-1 rounded-xl bg-sky-500/20 border border-sky-400/40 px-2.5 py-1 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/30 transition shadow-xs"
                >
                  <Timer className="h-3 w-3" />
                  <span>Focus</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                title="Delete task"
                className="rounded-lg p-1 text-white/50 hover:bg-rose-500/20 hover:text-rose-300 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-white/70 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges / Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {/* Due date */}
            {task.due_date && (
              <span
                className={`flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium border ${
                  task.is_overdue
                    ? 'bg-rose-500/25 text-rose-200 border-rose-400/40'
                    : task.is_due_today
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
                    : 'bg-white/10 text-white/80 border-white/15'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {task.is_overdue ? 'Overdue: ' : task.is_due_today ? 'Today' : ''} {task.due_date}
                {task.due_time && ` ${task.due_time.slice(0, 5)}`}
              </span>
            )}

            {/* Priority flag */}
            <span
              className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 font-semibold text-[10px] ${pConfig.bg} ${pConfig.iconColor}`}
            >
              <Flag className="h-2.5 w-2.5 fill-current" />
              {pConfig.text}
            </span>

            {/* Project Pill */}
            {projectName && (
              <span className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/15 px-2 py-0.5 text-white/80">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: projectColor || '#4880ec' }}
                />
                {projectName}
              </span>
            )}

            {/* Estimated time */}
            {task.estimated_minutes && (
              <span className="flex items-center gap-1 text-white/60">
                <Clock className="h-3 w-3" />
                {task.estimated_minutes}m
              </span>
            )}

            {/* Tags */}
            {task.tags &&
              task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-lg bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] text-white/70"
                >
                  #{tag.name}
                </span>
              ))}

            {/* Subtasks expand toggle */}
            {(task.subtask_count || 0) > 0 || (task.subtasks && task.subtasks.length > 0) ? (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-sky-300 hover:text-sky-200 font-semibold ml-auto transition"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span>
                  {task.subtasks?.filter((s) => s.status === 'done').length || 0}/
                  {task.subtask_count || task.subtasks?.length || 0} subtasks
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Subtasks expansion drawer */}
      {expanded && (
        <div className="border-t border-white/10 bg-black/20 px-4 py-3 rounded-b-2xl">
          <div className="space-y-1.5 pl-6">
            {task.subtasks &&
              task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(sub)}
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
                      sub.status === 'done'
                        ? 'border-emerald-400 bg-emerald-500 text-white'
                        : 'border-white/30 bg-white/5'
                    }`}
                  >
                    {sub.status === 'done' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </button>
                  <span
                    className={
                      sub.status === 'done'
                        ? 'line-through text-white/40'
                        : 'text-white/80'
                    }
                  >
                    {sub.title}
                  </span>
                </div>
              ))}

            {/* Quick add subtask form */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-2">
              <Plus className="h-3.5 w-3.5 text-white/50" />
              <input
                type="text"
                placeholder="Add subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-transparent border-0 border-b border-white/30 text-xs text-white placeholder-white/40 focus:border-white focus:outline-none pb-0.5"
              />
              {newSubtaskTitle.trim() && (
                <button
                  type="submit"
                  disabled={submittingSubtask}
                  className="rounded-lg bg-[#4880ec] px-2.5 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-500 shadow-xs"
                >
                  Add
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
