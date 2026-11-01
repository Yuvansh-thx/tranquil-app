'use client';

import React from 'react';
import { Menu, Search, Plus, Play, Pause, Square, Timer } from 'lucide-react';
import { useQuickAdd } from '@/lib/context/QuickAddContext';
import { useFocus } from '@/lib/context/FocusContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export function Header({ onToggleSidebar, onOpenSearch }: HeaderProps) {
  const { openQuickAdd } = useQuickAdd();
  const {
    isRunning,
    isPaused,
    timeLeft,
    activeTaskTitle,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useFocus();

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/50 dark:border-white/10 bg-white/75 dark:bg-slate-950/60 px-4 sm:px-8 backdrop-blur-2xl">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Icon Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          title="Search todos & notes (⌘K)"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/20 bg-white/80 dark:bg-white/10 text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/20 backdrop-blur-md shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <Search className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Center/Right: Active Pomodoro Banner & New Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isRunning && (
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/20 px-3.5 py-1.5 text-xs text-sky-200 backdrop-blur-md shadow-lg shadow-sky-500/20">
            <Timer className="h-3.5 w-3.5 text-sky-300 animate-pulse" />
            <span className="font-mono font-bold text-sm tracking-tight">
              {formatTimer(timeLeft)}
            </span>
            {activeTaskTitle && (
              <span className="max-w-[120px] md:max-w-[180px] truncate text-white/80">
                · {activeTaskTitle}
              </span>
            )}
            <div className="flex items-center gap-1 ml-1 border-l border-sky-400/30 pl-2">
              {isPaused ? (
                <button
                  type="button"
                  onClick={resumeTimer}
                  title="Resume"
                  className="rounded p-1 hover:bg-white/20"
                >
                  <Play className="h-3 w-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseTimer}
                  title="Pause"
                  className="rounded p-1 hover:bg-white/20"
                >
                  <Pause className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={stopTimer}
                title="Stop Session"
                className="rounded p-1 hover:bg-rose-500/30 hover:text-rose-200"
              >
                <Square className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Add Button with Vibrant Blue Glow */}
        <button
          type="button"
          onClick={() => openQuickAdd('task')}
          className="flex items-center gap-1.5 rounded-2xl bg-[#4880ec] hover:bg-[#3b71db] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </header>
  );
}
