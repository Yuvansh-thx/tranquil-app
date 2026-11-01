'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, FileText, Flag, Calendar, Folder, Pin, Sparkles, Link2 } from 'lucide-react';
import { useQuickAdd } from '@/lib/context/QuickAddContext';
import { tasksApi } from '@/lib/api/tasks';
import { notesApi } from '@/lib/api/notes';
import { projectsApi } from '@/lib/api/projects';
import { Priority, Project } from '@/types';
import { NoteLinkPickerModal } from '../notes/NoteLinkPickerModal';

export function QuickAddModal() {
  const { isOpen, activeTab, closeQuickAdd, openQuickAdd } = useQuickAdd();

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskEstimatedMinutes, setTaskEstimatedMinutes] = useState<number | ''>('');

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('default');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  // Shared state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      projectsApi.getProjects().then(setProjects).catch(() => {});
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const keepColors = [
    { id: 'default', label: 'Default', bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
    { id: 'coral', label: 'Coral', bg: 'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-900' },
    { id: 'peach', label: 'Peach', bg: 'bg-orange-100 dark:bg-orange-950/60 border-orange-300 dark:border-orange-900' },
    { id: 'sand', label: 'Sand', bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-900' },
    { id: 'mint', label: 'Mint', bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-900' },
    { id: 'sage', label: 'Sage', bg: 'bg-teal-100 dark:bg-teal-950/60 border-teal-300 dark:border-teal-900' },
    { id: 'fog', label: 'Fog', bg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-900' },
    { id: 'storm', label: 'Storm', bg: 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700' },
    { id: 'blossom', label: 'Blossom', bg: 'bg-pink-100 dark:bg-pink-950/60 border-pink-300 dark:border-pink-900' },
    { id: 'clay', label: 'Clay', bg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-900' },
  ];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await tasksApi.createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        due_date: taskDueDate || undefined,
        project: taskProjectId || undefined,
        estimated_minutes: taskEstimatedMinutes ? Number(taskEstimatedMinutes) : undefined,
      });
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskEstimatedMinutes('');
      closeQuickAdd();
      window.dispatchEvent(new CustomEvent('tranquil:refresh'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await notesApi.createNote({
        title: noteTitle.trim(),
        content: noteContent,
        color: noteColor,
        is_pinned: noteIsPinned,
      });
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setNoteColor('default');
      setNoteIsPinned(false);
      closeQuickAdd();
      window.dispatchEvent(new CustomEvent('tranquil:refresh'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[32px] border border-white/20 bg-slate-950/85 backdrop-blur-2xl shadow-2xl overflow-hidden text-white">
        {/* Tabs Header */}
        <div className="flex items-center justify-between border-b border-white/15 px-6 pt-5 pb-3">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => openQuickAdd('task')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'task'
                  ? 'bg-[#4880ec] text-white shadow-md shadow-blue-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Task
            </button>
            <button
              type="button"
              onClick={() => openQuickAdd('note')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'note'
                  ? 'bg-[#4880ec] text-white shadow-md shadow-blue-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Note
            </button>
          </div>

          <button
            type="button"
            onClick={closeQuickAdd}
            className="rounded-xl p-2 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-2xl border border-rose-500/30 bg-rose-950/50 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Tab 1: Task Form */}
        {activeTab === 'task' && (
          <form onSubmit={handleCreateTask} className="p-6 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Task title (e.g. Finish quarterly presentation)"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-base font-bold text-white placeholder-white/40 focus:outline-none bg-transparent"
                autoFocus
              />
            </div>

            <div>
              <textarea
                placeholder="Description, sub-steps, or details..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={2}
                className="w-full resize-none text-xs text-white/90 placeholder-white/40 focus:outline-none bg-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
              {/* Due date */}
              <div>
                <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3 w-3 text-sky-400" /> Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5 mb-1">
                  <Flag className="h-3 w-3 text-sky-400" /> Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="w-full rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="low" className="bg-slate-900 text-white">Low (P4)</option>
                  <option value="medium" className="bg-slate-900 text-white">Medium (P3)</option>
                  <option value="high" className="bg-slate-900 text-white">High (P2)</option>
                  <option value="urgent" className="bg-slate-900 text-white">Urgent (P1)</option>
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5 mb-1">
                  <Folder className="h-3 w-3 text-sky-400" /> Project
                </label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-slate-900 text-white">Inbox (No project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated minutes */}
              <div>
                <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5 mb-1">
                  Est. Minutes
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={taskEstimatedMinutes}
                  onChange={(e) => setTaskEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/15">
              <button
                type="button"
                onClick={closeQuickAdd}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !taskTitle.trim()}
                className="rounded-xl bg-[#4880ec] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] disabled:opacity-50 active:scale-[0.98] transition"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Note Form (Keep + Obsidian) */}
        {activeTab === 'note' && (
          <form onSubmit={handleCreateNote} className="p-6 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full text-base font-bold text-white placeholder-white/40 focus:outline-none bg-transparent"
                autoFocus
              />
            </div>

            <div>
              <textarea
                placeholder="Take a note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="w-full resize-none text-xs text-white/90 placeholder-white/40 focus:outline-none bg-transparent leading-relaxed"
              />
            </div>

            {/* Note Options (Link & Pin note) */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowLinkPicker(true)}
                title="Link to another note [[wikilink]]"
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-white hover:bg-white/20 transition active:scale-[0.98]"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link Note</span>
              </button>

              <label className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteIsPinned}
                  onChange={(e) => setNoteIsPinned(e.target.checked)}
                  className="rounded border-white/30 text-blue-500 focus:ring-blue-400"
                />
                <Pin className="h-3 w-3 text-amber-300" /> Pin note
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/15">
              <button
                type="button"
                onClick={closeQuickAdd}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!noteTitle.trim() && !noteContent.trim())}
                className="rounded-xl bg-[#4880ec] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] disabled:opacity-50 active:scale-[0.98] transition"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
            </div>

            <NoteLinkPickerModal
              isOpen={showLinkPicker}
              onClose={() => setShowLinkPicker(false)}
              onSelectNote={(target) => {
                const linkStr = `[[${target.title}]]`;
                setNoteContent((prev) => (prev.trim() ? `${prev.trim()}\n- ${linkStr}` : linkStr));
              }}
            />
          </form>
        )}
      </div>
    </div>
  );
}
