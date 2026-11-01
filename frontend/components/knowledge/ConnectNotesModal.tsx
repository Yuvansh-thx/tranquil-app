'use client';

import React, { useState, useEffect } from 'react';
import { Network, Link2, X, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Note } from '@/types';
import { notesApi } from '@/lib/api/notes';

interface ConnectNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
  initialSourceId?: string;
  initialTargetId?: string;
}

export function ConnectNotesModal({
  isOpen,
  onClose,
  onConnected,
  initialSourceId,
  initialTargetId,
}: ConnectNotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setLoading(true);
      notesApi
        .getNotes({ is_archived: false })
        .then((data) => {
          setNotes(data);
          if (initialSourceId) {
            setSourceId(initialSourceId);
          } else if (data.length > 0) {
            setSourceId(data[0].id);
          }
          if (initialTargetId) {
            setTargetId(initialTargetId);
          } else if (data.length > 1) {
            const second = data.find((n) => n.id !== (initialSourceId || data[0].id));
            if (second) setTargetId(second.id);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialSourceId, initialTargetId]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setError('Please select both a source note and a target note.');
      return;
    }
    if (sourceId === targetId) {
      setError('Cannot link a note to itself. Please pick two different notes.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await notesApi.connectNotes(sourceId, targetId);
      const sourceNote = notes.find((n) => n.id === sourceId);
      const targetNote = notes.find((n) => n.id === targetId);
      setSuccess(`Linked "${sourceNote?.title || 'Note'}" → "${targetNote?.title || 'Note'}"!`);
      setTimeout(() => {
        onConnected();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect notes');
    } finally {
      setSaving(false);
    }
  };

  const sourceNote = notes.find((n) => n.id === sourceId);
  const targetNote = notes.find((n) => n.id === targetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-slate-950/90 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Link Notes in Graph</h3>
              <p className="text-[11px] text-white/50">
                Create a bidirectional link connection between any two notes
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

        {/* Content */}
        <form onSubmit={handleConnect} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Connection Preview Visualizer */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between gap-3 text-center">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-semibold text-white/40 block mb-1">
                Source Note
              </span>
              <p className="text-xs font-bold text-sky-300 truncate">
                {sourceNote?.title || 'Select source'}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center flex-shrink-0 px-2">
              <span className="font-mono text-[9px] text-white/40">[[link]]</span>
              <div className="h-0.5 w-10 bg-gradient-to-r from-sky-400 to-indigo-400 my-1 relative">
                <ArrowRight className="h-3 w-3 text-indigo-300 absolute -right-1 -top-1.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-semibold text-white/40 block mb-1">
                Target Note
              </span>
              <p className="text-xs font-bold text-indigo-300 truncate">
                {targetNote?.title || 'Select target'}
              </p>
            </div>
          </div>

          {/* Dropdown 1: Source Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">From Note (Source)</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              disabled={loading || saving}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400 transition"
            >
              {notes.map((n) => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                  {n.title || 'Untitled'}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/40">
              A wikilink to the target note will be embedded in this note's body.
            </p>
          </div>

          {/* Dropdown 2: Target Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">To Note (Target)</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={loading || saving}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400 transition"
            >
              {notes.map((n) => (
                <option
                  key={n.id}
                  value={n.id}
                  disabled={n.id === sourceId}
                  className="bg-slate-900 text-white"
                >
                  {n.title || 'Untitled'} {n.id === sourceId ? '(Current Source)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !sourceId || !targetId || sourceId === targetId}
              className="flex items-center gap-2 rounded-xl bg-[#4880ec] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] disabled:opacity-50 active:scale-[0.98] transition"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>{saving ? 'Connecting...' : 'Create Link in Graph'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
