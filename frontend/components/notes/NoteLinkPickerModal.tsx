'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Link2, X, Plus, Sparkles, FileText, CornerDownLeft } from 'lucide-react';
import { Note } from '@/types';
import { notesApi } from '@/lib/api/notes';

interface NoteLinkPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (target: { id?: string; title: string }) => void;
  excludeNoteId?: string;
  title?: string;
}

export function NoteLinkPickerModal({
  isOpen,
  onClose,
  onSelectNote,
  excludeNoteId,
  title = 'Link to Note',
}: NoteLinkPickerModalProps) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setLoading(true);
      notesApi
        .getNotes({ is_archived: false })
        .then((data) => {
          setNotes(data.filter((n) => n.id !== excludeNoteId));
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, excludeNoteId]);

  if (!isOpen) return null;

  const filteredNotes = notes.filter((n) =>
    (n.title || 'Untitled').toLowerCase().includes(query.toLowerCase().trim())
  );

  const exactMatch = notes.some(
    (n) => (n.title || '').toLowerCase().trim() === query.toLowerCase().trim()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-slate-950/90 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[85vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[11px] text-white/50">
                Connect notes with bidirectional <span className="font-mono text-sky-300">[[wikilinks]]</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 focus-within:border-sky-400 focus-within:bg-white/10 transition">
            <Search className="h-4 w-4 text-sky-300 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search existing notes or type new link..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  e.preventDefault();
                  if (filteredNotes.length > 0) {
                    const first = filteredNotes[0];
                    onSelectNote({ id: first.id, title: first.title || 'Untitled' });
                  } else {
                    onSelectNote({ title: query.trim() });
                  }
                  onClose();
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-white/40 hover:text-white p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-white/5">
          {loading ? (
            <div className="flex py-12 items-center justify-center text-xs text-white/40 gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              <span>Loading notes...</span>
            </div>
          ) : (
            <>
              {/* Option to create link to new title if query doesn't match */}
              {query.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectNote({ title: query.trim() });
                    onClose();
                  }}
                  className="w-full text-left flex items-center justify-between p-3 rounded-2xl hover:bg-sky-500/15 border border-sky-500/30 transition group mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 group-hover:scale-105 transition">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-sky-200">
                        Link to new note: <span className="font-mono text-white">[[{query.trim()}]]</span>
                      </p>
                      <p className="text-[10px] text-white/50">Creates connection to this new topic</p>
                    </div>
                  </div>
                  <CornerDownLeft className="h-3.5 w-3.5 text-sky-300 opacity-60 group-hover:opacity-100" />
                </button>
              )}

              {filteredNotes.length === 0 && !query.trim() ? (
                <div className="py-12 text-center text-xs text-white/50">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-white/30" />
                  <p>No other active notes found.</p>
                </div>
              ) : (
                filteredNotes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onSelectNote({ id: n.id, title: n.title || 'Untitled' });
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 transition group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-white/70 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition flex-shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white group-hover:text-sky-200 transition truncate">
                          {n.title || 'Untitled'}
                        </p>
                        {n.content ? (
                          <p className="text-[10px] text-white/40 truncate max-w-sm mt-0.5">
                            {n.content.replace(/#+\s*/g, '').slice(0, 80)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="font-mono text-[10px] text-sky-300/80 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                        [[link]]
                      </span>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
          <span>Tip: Press Enter to select first match</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
