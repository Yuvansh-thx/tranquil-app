'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckSquare, FileText, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { projectsApi } from '@/lib/api/projects';
import { tasksApi } from '@/lib/api/tasks';
import { notesApi } from '@/lib/api/notes';
import { Project, Task, Note } from '@/types';
import { TaskList } from '@/components/tasks/TaskList';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteEditorModal } from '@/components/notes/NoteEditorModal';

const getProjectColor = (color?: string) => {
  if (!color) return '#3b82f6';
  if (color.startsWith('#') || color.startsWith('rgb')) return color;
  const map: Record<string, string> = {
    blue: '#3b82f6',
    indigo: '#6366f1',
    slate: '#64748b',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
  };
  return map[color.toLowerCase()] || '#3b82f6';
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [projData, tasksData, notesData] = await Promise.all([
        projectsApi.getProject(projectId),
        tasksApi.getTasks({ project: projectId }),
        notesApi.getNotes({ project: projectId }),
      ]);
      setProject(projData);
      setTasks(tasksData);
      setNotes(notesData);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectsApi.deleteProject(projectId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tranquil:refresh'));
      }
      router.push('/projects');
    } catch {
      // Ignore
    }
  };

  if (isLoading || (loading && !user)) {
    return (
      <div className="flex h-64 items-center justify-center text-white/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 text-slate-600 dark:text-white/60">
        <p>Project not found.</p>
        <Link href="/projects" className="text-blue-600 dark:text-sky-300 underline text-xs mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Back button & Project Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-sky-300 hover:text-blue-800 dark:hover:text-white mb-4 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Projects</span>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 h-3.5 w-3.5 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: getProjectColor(project.color) }}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeleteProject}
            title="Delete project"
            className="rounded-xl p-2 text-slate-400 dark:text-white/60 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs: Tasks / Notes */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-white/15">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'tasks'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-sky-200'
              : 'border-transparent text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Tasks ({tasks.filter((t) => t.status !== 'done').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'notes'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-sky-200'
              : 'border-transparent text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Project Notes ({notes.length})</span>
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <TaskList
          tasks={tasks}
          projects={[project]}
          onRefresh={fetchData}
          defaultProjectId={project.id}
          isInbox={false}
        />
      ) : (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-xl py-16 text-center text-xs text-white/60 shadow-lg">
              No notes in this project yet. Use the Quick Add button to write a note linked to this project.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onUpdate={fetchData}
                  onEdit={(n) => setSelectedNote(n)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Editor Modal */}
      <NoteEditorModal
        note={selectedNote}
        isOpen={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
        onUpdate={fetchData}
        onOpenNote={(id) => {
          notesApi.getNote(id).then(setSelectedNote).catch(() => {});
        }}
      />
    </div>
  );
}
