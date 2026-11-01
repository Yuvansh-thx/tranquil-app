'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Network, ArrowLeft, RefreshCw, Sparkles, FileText, Link2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { notesApi } from '@/lib/api/notes';
import { GraphData, Note } from '@/types';
import { KnowledgeGraphCanvas } from '@/components/knowledge/KnowledgeGraphCanvas';
import { NoteEditorModal } from '@/components/notes/NoteEditorModal';
import { ConnectNotesModal } from '@/components/knowledge/ConnectNotesModal';

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notesApi.getGraph();
      setGraphData(data);
    } catch {
      // Ignore
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
      fetchGraph();
    }
  }, [user, isLoading, router, fetchGraph]);

  const handleNodeClick = async (nodeId: string) => {
    try {
      const note = await notesApi.getNote(nodeId);
      setSelectedNote(note);
    } catch {
      // Ignore
    }
  };

  const handleConnectNodes = async (sourceId: string, targetId: string) => {
    try {
      await notesApi.connectNotes(sourceId, targetId);
      await fetchGraph();
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

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-white mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Notes Hub</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
            <Network className="h-6 w-6 text-sky-400" />
            Knowledge Graph
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-white/60">
            Interactive map of your thoughts. Node radius reflects incoming connections from [[wikilinks]].
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#4880ec] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] backdrop-blur-md transition active:scale-[0.98]"
            title="Link two notes together"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Link Notes</span>
          </button>

          <button
            type="button"
            onClick={fetchGraph}
            className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-white/20 backdrop-blur-md transition active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5 text-sky-300" />
            <span>Reload Graph</span>
          </button>
        </div>
      </div>

      {/* Interactive 2D Graph Canvas */}
      {graphData.nodes.length === 0 ? (
        <div className="rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur-xl py-20 text-center text-xs text-white/60 shadow-lg">
          <p className="font-semibold text-white text-sm">
            No notes connected yet
          </p>
          <p className="mt-1 max-w-sm mx-auto text-white/60">
            Create notes in the Notes hub and link them together using <span className="font-mono text-sky-300">[[Note Title]]</span> syntax to watch your knowledge web grow.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <Link2 className="h-4 w-4 text-sky-300" />
              <span>Connect Existing Notes</span>
            </button>
            <Link
              href="/notes"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#4880ec] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-[#3b6edc] active:scale-[0.98] transition"
            >
              <FileText className="h-4 w-4" />
              <span>Go to Notes</span>
            </Link>
          </div>
        </div>
      ) : (
        <KnowledgeGraphCanvas
          graphData={graphData}
          onNodeClick={handleNodeClick}
          onConnectNodes={handleConnectNodes}
        />
      )}

      {/* Note Editor Modal if clicked */}
      <NoteEditorModal
        note={selectedNote}
        isOpen={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
        onUpdate={fetchGraph}
        onOpenNote={(id) => {
          notesApi.getNote(id).then(setSelectedNote).catch(() => {});
        }}
      />

      {/* Connect Notes Modal */}
      <ConnectNotesModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={fetchGraph}
      />
    </div>
  );
}
