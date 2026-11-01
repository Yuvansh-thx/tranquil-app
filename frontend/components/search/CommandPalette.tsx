'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckSquare,
  FileText,
  Timer,
  LayoutDashboard,
  Calendar,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { searchApi } from '@/lib/api/search';
import { SearchResults } from '@/types';
import { useFocus } from '@/lib/context/FocusContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { startFocus } = useFocus();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ query: '', tasks: [], notes: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ query: '', tasks: [], notes: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ query: '', tasks: [], notes: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.search(query.trim());
        setResults(data);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const quickActions = [
    {
      label: 'Start 25m Focus Session',
      icon: Timer,
      action: () => {
        startFocus();
        navigateTo('/focus');
      },
    },
    {
      label: 'Go to Today',
      icon: Calendar,
      action: () => navigateTo('/today'),
    },
    {
      label: 'Go to Inbox',
      icon: CheckSquare,
      action: () => navigateTo('/inbox'),
    },
    {
      label: 'Go to Notes Hub',
      icon: FileText,
      action: () => navigateTo('/notes'),
    },
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      action: () => navigateTo('/'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/85 backdrop-blur-2xl shadow-2xl transition-all text-white">
        {/* Input box */}
        <div className="flex items-center border-b border-white/15 px-5 py-3.5">
          <Search className="h-5 w-5 text-sky-300 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, notes, or run a quick command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent mr-2" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results / Navigation body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim().length >= 2 ? (
            <>
              {results.tasks.length === 0 && results.notes.length === 0 && !loading && (
                <div className="py-8 text-center text-xs text-white/50">
                  No matching tasks or notes found for &quot;{query}&quot;.
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                    Tasks ({results.tasks.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => navigateTo(`/tasks?id=${task.id}`)}
                        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition hover:bg-white/10 group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <CheckSquare className="h-4 w-4 text-sky-400 flex-shrink-0" />
                          <span className={`truncate font-medium ${task.status === 'done' ? 'line-through text-white/40' : 'text-white'}`}>
                            {task.title}
                          </span>
                        </div>
                        {task.project_name && (
                          <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] text-sky-200">
                            {task.project_name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.notes.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                    Notes ({results.notes.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.notes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => navigateTo(`/notes?id=${note.id}`)}
                        className="w-full flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs transition hover:bg-white/10 group"
                      >
                        <FileText className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div className="truncate flex-1">
                          <p className="font-semibold text-white truncate">
                            {note.title || 'Untitled Note'}
                          </p>
                          {note.content_preview && (
                            <p className="text-[11px] text-white/60 truncate">
                              {note.content_preview}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                <Sparkles className="h-3 w-3 text-sky-400" />
                Quick Actions
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.label}
                      type="button"
                      onClick={qa.action}
                      className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs text-white/90 hover:text-white hover:bg-white/10 transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-sky-400 group-hover:scale-110 transition" />
                        <span className="font-medium">{qa.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
