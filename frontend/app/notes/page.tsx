'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Pin,
  Archive,
  Network,
  Search,
  Filter,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { notesApi, NoteFilterParams } from '@/lib/api/notes';
import { Note } from '@/types';
import { NoteCard } from '@/components/notes/NoteCard';
import { QuickNoteInput } from '@/components/notes/QuickNoteInput';
import { NoteEditorModal } from '@/components/notes/NoteEditorModal';

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialNoteId = searchParams.get('id');

  const { user, isLoading } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'pinned' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params: NoteFilterParams = {};
      if (filterTab === 'pinned') params.is_pinned = true;
      if (filterTab === 'archived') params.is_archived = true;
      else params.is_archived = false;

      if (searchQuery.trim()) params.search = searchQuery.trim();

      const list = await notesApi.getNotes(params);
      setNotes(list);

      // If initialNoteId requested via URL
      if (initialNoteId) {
        const found = list.find((n) => n.id === initialNoteId);
        if (found) setSelectedNote(found);
        else {
          notesApi.getNote(initialNoteId).then(setSelectedNote).catch(() => {});
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [filterTab, searchQuery, initialNoteId]);

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

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const otherNotes = notes.filter((n) => !n.is_pinned);

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
            <FileText className="h-6 w-6 text-sky-400" />
            Notes & Knowledge Hub
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-white/60">
            Google Keep card capture meets Obsidian bidirectional [[wikilinks]].
          </p>
        </div>

        <Link
          href="/knowledge-graph"
          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-4 py-2 text-xs font-bold text-sky-200 hover:bg-white/20 shadow-md transition self-start sm:self-auto backdrop-blur-md active:scale-[0.98]"
        >
          <Network className="h-4 w-4" />
          <span>Knowledge Graph</span>
        </Link>
      </div>

      {/* Google Keep Quick Note Input */}
      {filterTab !== 'archived' && (
        <QuickNoteInput onCreated={fetchData} />
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/65 backdrop-blur-2xl p-1 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-300 shadow-md'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Notes
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pinned')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === 'pinned'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-300 shadow-md'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Pin className="h-3 w-3" />
            Pinned
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('archived')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === 'archived'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-300 shadow-md'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="h-3 w-3" />
            Archive
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-sky-300" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-48 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md pl-7 pr-3 py-1.5 text-xs text-white placeholder-white/40 shadow-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-xl py-16 text-center text-xs text-white/60 shadow-lg">
          No notes found. Capture your first thought with &ldquo;Take a note...&rdquo; above!
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned section if in "All" view */}
          {filterTab === 'all' && pinnedNotes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1">
                <Pin className="h-3 w-3 fill-current" /> Pinned Notes ({pinnedNotes.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onUpdate={fetchData}
                    onEdit={(n) => setSelectedNote(n)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other notes section */}
          <div>
            {filterTab === 'all' && pinnedNotes.length > 0 && (
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">
                Other Notes ({otherNotes.length})
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(filterTab === 'all' ? otherNotes : notes).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onUpdate={fetchData}
                  onEdit={(n) => setSelectedNote(n)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full Note Editor Modal */}
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

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-white/50">Loading notes...</div>}>
      <NotesContent />
    </Suspense>
  );
}
