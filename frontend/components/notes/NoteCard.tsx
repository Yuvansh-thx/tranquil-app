'use client';

import React, { useState } from 'react';
import { Pin, Archive, Copy, Trash2, Palette, Network } from 'lucide-react';
import { Note } from '@/types';
import { notesApi } from '@/lib/api/notes';

interface NoteCardProps {
  note: Note;
  onUpdate: () => void;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onUpdate, onEdit }: NoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const keepColorClasses: Record<string, { bg: string; border: string }> = {
    default: { bg: 'bg-white/[0.08] backdrop-blur-xl', border: 'border-white/20' },
    coral: { bg: 'bg-rose-950/40 backdrop-blur-xl', border: 'border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
    peach: { bg: 'bg-orange-950/40 backdrop-blur-xl', border: 'border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.15)]' },
    sand: { bg: 'bg-amber-950/40 backdrop-blur-xl', border: 'border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
    mint: { bg: 'bg-emerald-950/40 backdrop-blur-xl', border: 'border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
    sage: { bg: 'bg-teal-950/40 backdrop-blur-xl', border: 'border-teal-400/40 shadow-[0_0_20px_rgba(20,184,166,0.15)]' },
    fog: { bg: 'bg-indigo-950/40 backdrop-blur-xl', border: 'border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]' },
    storm: { bg: 'bg-slate-900/60 backdrop-blur-xl', border: 'border-slate-500/40' },
    blossom: { bg: 'bg-pink-950/40 backdrop-blur-xl', border: 'border-pink-400/40 shadow-[0_0_20px_rgba(236,72,153,0.15)]' },
    clay: { bg: 'bg-purple-950/40 backdrop-blur-xl', border: 'border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]' },
  };

  const paletteColors = [
    'default', 'coral', 'peach', 'sand', 'mint', 'sage', 'fog', 'storm', 'blossom', 'clay'
  ];

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notesApi.pinNote(note.id);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (note.is_archived) {
        await notesApi.restoreNote(note.id);
      } else {
        await notesApi.archiveNote(note.id);
      }
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notesApi.duplicateNote(note.id);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notesApi.deleteNote(note.id);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const handleChangeColor = async (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notesApi.updateNote(note.id, { color });
      setShowColorPicker(false);
      onUpdate();
    } catch {
      // Ignore
    }
  };

  const colorStyle = keepColorClasses[note.color] || keepColorClasses.default;

  return (
    <div
      onClick={() => onEdit(note)}
      className={`group relative flex flex-col justify-between rounded-3xl border p-5 shadow-xl hover:scale-[1.02] hover:border-white/30 transition-all cursor-pointer ${colorStyle.bg} ${colorStyle.border}`}
    >
      {/* Top Header: Title & Pin */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm sm:text-base text-white leading-snug break-words drop-shadow-sm">
            {note.title || 'Untitled'}
          </h3>
          <button
            type="button"
            onClick={handleTogglePin}
            title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            className={`rounded-full p-1.5 transition ${
              note.is_pinned
                ? 'text-sky-300 opacity-100'
                : 'text-white/40 opacity-0 group-hover:opacity-100 hover:text-white'
            }`}
          >
            <Pin className={`h-4 w-4 ${note.is_pinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content Preview */}
        {note.content_preview ? (
          <p className="mt-2.5 text-xs sm:text-sm text-white/80 line-clamp-6 whitespace-pre-line leading-relaxed">
            {note.content_preview}
          </p>
        ) : (
          <p className="mt-2 text-xs text-white/40 italic">
            Empty note
          </p>
        )}
      </div>

      {/* Footer Area: Tags & Backlink count */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {/* Backlinks badge if connected in knowledge graph */}
          {note.backlink_count !== undefined && note.backlink_count > 0 && (
            <span
              title={`${note.backlink_count} notes link to this note`}
              className="flex items-center gap-1 rounded-lg bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 text-[10px] font-semibold text-sky-200 shadow-2xs"
            >
              <Network className="h-2.5 w-2.5" />
              {note.backlink_count} {note.backlink_count === 1 ? 'link' : 'links'}
            </span>
          )}

          {/* Tags */}
          {note.tags &&
            note.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-lg bg-white/10 border border-white/15 px-2 py-0.5 text-[10px] text-white/80"
              >
                #{tag.name}
              </span>
            ))}
        </div>

        {/* Action bar (Hover on desktop, always visible on mobile) */}
        <div className="flex items-center justify-between text-white/60 opacity-80 group-hover:opacity-100 transition">
          <div className="relative flex items-center gap-1">

            <button
              type="button"
              onClick={handleDuplicate}
              title="Duplicate note"
              className="rounded-lg p-1.5 hover:bg-white/15 text-white/70 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleArchive}
              title={note.is_archived ? 'Restore' : 'Archive'}
              className="rounded-lg p-1.5 hover:bg-white/15 text-white/70 hover:text-white"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete note"
            className="rounded-lg p-1.5 hover:bg-rose-500/25 hover:text-rose-300 text-white/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
