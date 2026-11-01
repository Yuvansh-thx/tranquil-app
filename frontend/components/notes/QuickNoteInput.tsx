'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pin, Palette, CheckSquare, Sparkles, Link2 } from 'lucide-react';
import { notesApi } from '@/lib/api/notes';
import { NoteLinkPickerModal } from './NoteLinkPickerModal';

interface QuickNoteInputProps {
  onCreated: () => void;
}

export function QuickNoteInput({ onCreated }: QuickNoteInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const keepColorClasses: Record<string, { bg: string; border: string }> = {
    default: { bg: 'bg-white/[0.08] backdrop-blur-xl', border: 'border-white/20' },
    coral: { bg: 'bg-red-500/15 backdrop-blur-xl', border: 'border-red-400/30' },
    peach: { bg: 'bg-orange-500/15 backdrop-blur-xl', border: 'border-orange-400/30' },
    sand: { bg: 'bg-amber-500/15 backdrop-blur-xl', border: 'border-amber-400/30' },
    mint: { bg: 'bg-emerald-500/15 backdrop-blur-xl', border: 'border-emerald-400/30' },
    sage: { bg: 'bg-teal-500/15 backdrop-blur-xl', border: 'border-teal-400/30' },
    fog: { bg: 'bg-indigo-500/15 backdrop-blur-xl', border: 'border-indigo-400/30' },
    storm: { bg: 'bg-slate-500/15 backdrop-blur-xl', border: 'border-slate-400/30' },
    blossom: { bg: 'bg-pink-500/15 backdrop-blur-xl', border: 'border-pink-400/30' },
    clay: { bg: 'bg-purple-500/15 backdrop-blur-xl', border: 'border-purple-400/30' },
  };

  const paletteColors = [
    'default', 'coral', 'peach', 'sand', 'mint', 'sage', 'fog', 'storm', 'blossom', 'clay'
  ];

  // Auto-save & close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (expanded) {
          handleSave();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded, title, content, color, isPinned]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      await notesApi.createNote({
        title: title.trim(),
        content: content,
        color: color,
        is_pinned: isPinned,
      });
      setTitle('');
      setContent('');
      setColor('default');
      setIsPinned(false);
      setExpanded(false);
      onCreated();
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const currentStyle = keepColorClasses[color] || keepColorClasses.default;

  return (
    <div
      ref={containerRef}
      className={`mx-auto w-full max-w-2xl rounded-3xl border shadow-xl transition-all ${currentStyle.bg} ${currentStyle.border}`}
    >
      {!expanded ? (
        <div
          onClick={() => setExpanded(true)}
          className="flex items-center justify-between px-5 py-3.5 cursor-text text-white/50 hover:text-white transition"
        >
          <span className="text-sm font-medium">Take a note...</span>
          <div className="flex items-center gap-1.5 text-sky-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="rounded-xl p-1.5 hover:bg-white/10 transition"
              title="New note"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-3.5">
          {/* Title & Pin */}
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-bold text-white placeholder-white/40 focus:outline-none bg-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin' : 'Pin'}
              className={`rounded-full p-1.5 transition ${
                isPinned ? 'text-amber-300 drop-shadow' : 'text-white/40 hover:text-white'
              }`}
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content */}
          <textarea
            placeholder="Take a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full resize-none text-sm text-white/90 placeholder-white/40 focus:outline-none bg-transparent leading-relaxed"
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/15">
            <button
              type="button"
              onClick={() => setShowLinkPicker(true)}
              title="Link to another note [[wikilink]]"
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-white hover:bg-white/20 transition active:scale-[0.98]"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Link Note</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-[#4880ec] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] active:scale-[0.98] transition"
              >
                {loading ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>

          <NoteLinkPickerModal
            isOpen={showLinkPicker}
            onClose={() => setShowLinkPicker(false)}
            onSelectNote={(target) => {
              const linkStr = `[[${target.title}]]`;
              setContent((prev) => (prev.trim() ? `${prev.trim()}\n- ${linkStr}` : linkStr));
            }}
          />
        </div>
      )}
    </div>
  );
}
