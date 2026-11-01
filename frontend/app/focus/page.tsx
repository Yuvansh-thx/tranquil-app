'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, CheckCircle, Clock, Sparkles, History, Flame, Settings } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useFocus } from '@/lib/context/FocusContext';
import { focusApi } from '@/lib/api/focus';
import { FocusSession } from '@/types';
import { PomodoroTimerView } from '@/components/focus/PomodoroTimerView';
import { PomodoroSettingsModal } from '@/components/focus/PomodoroSettingsModal';

export default function FocusPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { isRunning } = useFocus();

  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await focusApi.getSessions();
      setSessions(data);
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
      fetchSessions();
    }
  }, [user, isLoading, router, fetchSessions]);

  useEffect(() => {
    // When timer completes/stops, refresh sessions
    if (!isRunning) {
      fetchSessions();
    }
  }, [isRunning, fetchSessions]);

  if (isLoading || (loading && !user)) {
    return (
      <div className="flex h-64 items-center justify-center text-white/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalMins = completedSessions.reduce(
    (acc, s) => acc + Math.round((s.actual_duration_seconds || s.planned_duration_seconds) / 60),
    0
  );

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-10">
      {/* Top Header with Setting Logo on Top Right Corner */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5 drop-shadow-md">
            <Timer className="h-7 sm:h-8 w-7 sm:w-8 text-sky-400" />
            Focus &amp; Pomodoro
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-white/70 max-w-md">
            Deliberate single-task execution. Tune out distractions and cultivate deep work.
          </p>
        </div>

        {/* Setting Logo on Top Right Corner */}
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          title="Pomodoro Settings & Preferences"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-xl shadow-lg transition active:scale-95 cursor-pointer group"
        >
          <Settings className="h-5 w-5 text-sky-400 transition-transform duration-300 group-hover:rotate-45" />
        </button>
      </div>

      {/* Main Circular Timer */}
      <div className="relative rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 p-6 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          title="Configure Timer Durations"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/15 transition active:scale-95 cursor-pointer"
        >
          <Settings className="h-4 w-4 text-sky-400" />
        </button>
        <PomodoroTimerView />
      </div>

      {/* Session History & Daily Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              Recent Focus Sessions
            </h2>
          </div>
          <div className="text-xs font-medium text-white/70">
            Total today: <span className="font-bold text-sky-300">{totalMins}m</span> across{' '}
            <span className="font-bold text-sky-300">{completedSessions.length}</span> blocks
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-3xl border border-white/20 bg-white/[0.06] p-8 text-center text-xs text-white/50 backdrop-blur-xl">
            No focus sessions logged yet today. Press Start above to begin your first session!
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.slice(0, 8).map((session) => {
              const durMins = Math.round(
                (session.actual_duration_seconds || session.planned_duration_seconds) / 60
              );
              const timeStr = new Date(session.started_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 text-xs shadow-lg backdrop-blur-xl text-white"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : session.status === 'interrupted'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                      }`}
                    >
                      {session.status === 'completed' ? '✓' : '!'}
                    </span>
                    <div>
                      <p className="font-bold text-white">
                        {session.task_title || (session.session_type === 'work' ? 'Deep Work Block' : 'Break')}
                      </p>
                      <p className="text-[11px] text-white/60">
                        Started at {timeStr} · {session.session_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sky-300">
                      {durMins} mins
                    </span>
                    <span
                      className={`block text-[10px] uppercase font-semibold ${
                        session.status === 'completed'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pomodoro Settings & Preferences Modal */}
      <PomodoroSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
