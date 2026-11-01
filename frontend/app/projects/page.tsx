'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, CheckSquare, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { projectsApi } from '@/lib/api/projects';
import { Project } from '@/types';

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

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const list = await projectsApi.getProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await projectsApi.createProject({
        name: name.trim(),
        description: description.trim() || '',
        color: '#4880ec',
      });
      setName('');
      setDescription('');
      setShowCreate(false);
      await fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tranquil:refresh'));
      }
    } catch (err: any) {
      console.error('Failed to create project:', err);
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : (detail && typeof detail === 'object'
            ? Object.values(detail).flat().join(' ')
            : 'Failed to create project. Please try again.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectsApi.deleteProject(id);
      await fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tranquil:refresh'));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (isLoading || (loading && !user)) {
    return (
      <div className="flex h-64 items-center justify-center text-white/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            Projects
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-white/60">
            Organize commitments and milestones into focused workspaces.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(!showCreate);
            setError(null);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#4880ec] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Create Project Modal / Box */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-3xl border border-white/30 dark:border-white/20 bg-white/90 dark:bg-slate-950/85 backdrop-blur-2xl p-6 shadow-2xl space-y-4 max-w-lg text-slate-800 dark:text-white"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create New Project
            </h3>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Description or key milestones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setError(null);
              }}
              disabled={submitting}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#4880ec] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
            >
              {submitting && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{submitting ? 'Creating...' : 'Create'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/60 dark:border-white/15 bg-white/60 dark:bg-white/[0.05] backdrop-blur-xl py-16 text-center text-xs text-slate-600 dark:text-white/60 shadow-lg">
          No projects yet. Create your first project to organize related tasks and notes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-md hover:bg-white/95 dark:hover:bg-slate-900/85 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="h-3.5 w-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: getProjectColor(project.color) }}
                  />
                  <button
                    type="button"
                    onClick={(e) => handleDelete(project.id, e)}
                    title="Delete project"
                    className="opacity-0 group-hover:opacity-100 rounded-xl p-1.5 text-slate-400 dark:text-white/60 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-300 transition">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-white/60 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/15 flex items-center justify-between text-xs text-slate-600 dark:text-white/60 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-blue-500 dark:text-sky-400" />
                  {project.task_count || 0} tasks
                </span>
                <span className="text-blue-600 dark:text-sky-300 font-semibold text-[11px] group-hover:translate-x-0.5 transition">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

