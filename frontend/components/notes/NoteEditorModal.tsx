'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pin,
  Palette,
  Eye,
  Edit3,
  Network,
  Trash2,
  Archive,
  ExternalLink,
  Tag as TagIcon,
  Sparkles,
  Link2,
  Plus,
} from 'lucide-react';
import { Note, Backlink, NoteLink } from '@/types';
import { notesApi, NoteSuggestion } from '@/lib/api/notes';
import { NoteLinkPickerModal } from './NoteLinkPickerModal';

interface NoteEditorModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onOpenNote?: (id: string) => void;
}

function renderMarkdownWithWikilinks(text: string, onOpenNote?: (id: string) => void) {
  if (!text) return null;
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, idx) => {
        const match = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
        if (match) {
          const targetTitle = match[1].trim();
          const displayText = match[2]?.trim() || targetTitle;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                notesApi.getSuggestions(targetTitle).then((results) => {
                  const exact = results.find(
                    (r) => r.title.toLowerCase() === targetTitle.toLowerCase()
                  );
                  if (exact && onOpenNote) {
                    onOpenNote(exact.id);
                  }
                });
              }}
              className="inline-flex items-center gap-1 font-semibold text-sky-400 hover:text-sky-300 hover:underline bg-sky-500/15 border border-sky-500/25 px-2 py-0.5 rounded-lg mx-0.5 cursor-pointer text-xs align-baseline"
              title={`Open linked note: ${targetTitle}`}
            >
              <Link2 className="h-3 w-3 inline" />
              <span>{displayText}</span>
            </button>
          );
        }
        return part;
      })}
    </>
  );
}

export function NoteEditorModal({
  note,
  isOpen,
  onClose,
  onUpdate,
  onOpenNote,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obsidian Links & Backlinks
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [outgoingLinks, setOutgoingLinks] = useState<NoteLink[]>([]);
  const [suggestions, setSuggestions] = useState<NoteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionCursorPos, setSuggestionCursorPos] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const keepColorClasses: Record<string, { bg: string; border: string }> = {
    default: { bg: 'bg-slate-950/85 backdrop-blur-2xl', border: 'border-white/20' },
    coral: { bg: 'bg-red-950/75 backdrop-blur-2xl', border: 'border-red-500/30' },
    peach: { bg: 'bg-orange-950/75 backdrop-blur-2xl', border: 'border-orange-500/30' },
    sand: { bg: 'bg-amber-950/75 backdrop-blur-2xl', border: 'border-amber-500/30' },
    mint: { bg: 'bg-emerald-950/75 backdrop-blur-2xl', border: 'border-emerald-500/30' },
    sage: { bg: 'bg-teal-950/75 backdrop-blur-2xl', border: 'border-teal-500/30' },
    fog: { bg: 'bg-indigo-950/75 backdrop-blur-2xl', border: 'border-indigo-500/30' },
    storm: { bg: 'bg-slate-900/85 backdrop-blur-2xl', border: 'border-slate-500/30' },
    blossom: { bg: 'bg-pink-950/75 backdrop-blur-2xl', border: 'border-pink-500/30' },
    clay: { bg: 'bg-purple-950/75 backdrop-blur-2xl', border: 'border-purple-500/30' },
  };

  const paletteColors = [
    'default', 'coral', 'peach', 'sand', 'mint', 'sage', 'fog', 'storm', 'blossom', 'clay'
  ];

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || 'default');
      setIsPinned(note.is_pinned || false);
      setMode('edit');

      // Fetch Backlinks and Outgoing links
      notesApi.getBacklinks(note.id).then(setBacklinks).catch(() => {});
      notesApi.getLinks(note.id).then(setOutgoingLinks).catch(() => {});
    }
  }, [note, isOpen]);

  // Handle typing [[ for wikilink autocomplete
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);

    // Look backwards from cursor for [[
    const textBeforeCursor = val.slice(0, pos);
    const lastOpenIndex = textBeforeCursor.lastIndexOf('[[');
    const lastCloseIndex = textBeforeCursor.lastIndexOf(']]');

    if (lastOpenIndex !== -1 && lastOpenIndex > lastCloseIndex) {
      const query = textBeforeCursor.slice(lastOpenIndex + 2);
      if (!query.includes('\n')) {
        setSuggestionQuery(query);
        setSuggestionCursorPos(lastOpenIndex);
        setShowSuggestions(true);
        try {
          const list = await notesApi.getSuggestions(query);
          setSuggestions(list);
        } catch {
          // Ignore
        }
        return;
      }
    }
    setShowSuggestions(false);
  };

  const insertSuggestion = (suggestedTitle: string) => {
    if (suggestionCursorPos === null || !textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const before = content.slice(0, suggestionCursorPos);
    const after = content.slice(pos);
    const inserted = `${before}[[${suggestedTitle}]]${after}`;
    setContent(inserted);
    setShowSuggestions(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = suggestionCursorPos + suggestedTitle.length + 4;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  const handleSave = async () => {
    if (!note) return;
    setLoading(true);
    try {
      await notesApi.updateNote(note.id, {
        title: title.trim(),
        content: content,
        color: color,
        is_pinned: isPinned,
      });
      onUpdate();
      onClose();
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    try {
      await notesApi.deleteNote(note.id);
      onUpdate();
      onClose();
    } catch {
      // Ignore
    }
  };

  const handleToggleArchive = async () => {
    if (!note) return;
    try {
      if (note.is_archived) {
        await notesApi.restoreNote(note.id);
      } else {
        await notesApi.archiveNote(note.id);
      }
      onUpdate();
      onClose();
    } catch {
      // Ignore
    }
  };

  const handleSelectLink = async (target: { id?: string; title: string }) => {
    if (!note) return;
    const linkStr = `[[${target.title}]]`;
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart || content.length;
      const before = content.slice(0, pos);
      const after = content.slice(pos);
      const newContent = `${before}${before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : ''}${linkStr}${after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : ''}${after}`;
      setContent(newContent);
    } else {
      setContent((prev) => (prev.trim() ? `${prev.trim()}\n- ${linkStr}` : linkStr));
    }

    try {
      await notesApi.linkNote(note.id, target.id, target.title);
      const updatedLinks = await notesApi.getLinks(note.id);
      setOutgoingLinks(updatedLinks);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleUnlinkNote = async (targetId?: string | null, targetTitle?: string) => {
    if (!note) return;
    try {
      const updated = await notesApi.unlinkNote(note.id, targetId, targetTitle);
      if (updated && updated.content !== undefined) {
        setContent(updated.content);
      }
      const updatedLinks = await notesApi.getLinks(note.id);
      setOutgoingLinks(updatedLinks);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  if (!isOpen || !note) return null;

  const currentStyle = keepColorClasses[color] || keepColorClasses.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div
        className={`w-full max-w-3xl rounded-[32px] border shadow-2xl flex flex-col max-h-[88vh] overflow-hidden transition-all text-white ${currentStyle.bg} ${currentStyle.border}`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'edit'
                  ? 'bg-[#4880ec] text-white shadow-md shadow-blue-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'preview'
                  ? 'bg-[#4880ec] text-white shadow-md shadow-blue-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>

            {/* Quick Link Button in Header */}
            <button
              type="button"
              onClick={() => setShowLinkPicker(true)}
              title="Link to another note [[wikilink]]"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-white hover:bg-white/20 transition active:scale-[0.98] ml-2"
            >
              <Link2 className="h-3.5 w-3.5 text-sky-400" />
              <span>Link Note</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">

            {/* Pin */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin' : 'Pin'}
              className={`rounded-xl p-2 transition ${
                isPinned ? 'text-amber-300 drop-shadow' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            {/* Archive */}
            <button
              type="button"
              onClick={handleToggleArchive}
              title={note.is_archived ? 'Restore note' : 'Archive note (hides from graph)'}
              className={`rounded-xl p-2 transition ${
                note.is_archived ? 'text-indigo-400' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Archive className="h-4 w-4" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              title="Delete note"
              className="rounded-xl p-2 text-white/60 hover:bg-rose-500/20 hover:text-rose-300 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/60 hover:text-white hover:bg-white/10 transition ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Note Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl sm:text-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500 bg-transparent"
          />

          {mode === 'edit' ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder="Take a note..."
                value={content}
                onChange={handleContentChange}
                rows={12}
                className="w-full resize-none font-mono text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder-slate-500 bg-transparent"
              />

              {/* [[ Link Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-12 left-0 z-40 w-72 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 p-1.5">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Link to note:
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => insertSuggestion(s.title)}
                        className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 flex items-center justify-between"
                      >
                        <span className="truncate font-medium">{s.title}</span>
                        <span className="text-[10px] text-slate-400">[[link]]</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {content ? renderMarkdownWithWikilinks(content, onOpenNote) : <span className="italic text-slate-400">No content</span>}
            </div>
          )}

          {/* Knowledge Connections & Backlinks Panel */}
          {(backlinks.length > 0 || outgoingLinks.length > 0) && (
            <div className="mt-8 pt-5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Network className="h-3.5 w-3.5" />
                <span>Knowledge Connections</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Backlinks (incoming) */}
                <div className="rounded-xl border border-slate-200/80 bg-black/5 dark:bg-white/5 p-3 dark:border-slate-800/80">
                  <h5 className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Backlinks ({backlinks.length})
                  </h5>
                  {backlinks.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      No incoming links
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {backlinks.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            if (onOpenNote) onOpenNote(b.source_note_id);
                          }}
                          className="w-full text-left flex items-center justify-between rounded-lg px-2 py-1 text-xs text-slate-800 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          <span className="truncate font-medium">← {b.source_note_title}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing links */}
                <div className="rounded-xl border border-slate-200/80 bg-black/5 dark:bg-white/5 p-3 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Outgoing Links ({outgoingLinks.length})
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowLinkPicker(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition"
                      title="Link to note"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Link Note</span>
                    </button>
                  </div>
                  {outgoingLinks.length === 0 ? (
                    <div className="text-center py-3">
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-2">
                        No outgoing [[links]]
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowLinkPicker(true)}
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Link to another note</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {outgoingLinks.map((l) => (
                        <div
                          key={l.id}
                          className="w-full flex items-center justify-between rounded-lg px-2 py-1 text-xs text-slate-800 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10 group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (l.target_note_id && onOpenNote) {
                                onOpenNote(l.target_note_id);
                              }
                            }}
                            className="flex-1 text-left flex items-center justify-between truncate pr-2"
                          >
                            <span className="truncate font-medium">→ {l.target_note_title || l.target_title}</span>
                            {l.target_note_id && <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnlinkNote(l.target_note_id, l.target_title)}
                            title="Unlink note"
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer save button */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-white/15 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-[#4880ec] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] active:scale-[0.98] transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <NoteLinkPickerModal
        isOpen={showLinkPicker}
        onClose={() => setShowLinkPicker(false)}
        onSelectNote={handleSelectLink}
        excludeNoteId={note.id}
        title={`Link Note to "${note.title || 'Untitled'}"`}
      />
    </div>
  );
}
