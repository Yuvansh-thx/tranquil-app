'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipForward, Timer, CheckCircle, Sparkles, Folder } from 'lucide-react';
import { useFocus } from '@/lib/context/FocusContext';
import { useAuth } from '@/lib/context/AuthContext';
import { tasksApi } from '@/lib/api/tasks';
import { Task, FocusSessionType } from '@/types';

export function PomodoroTimerView() {
  const { settings } = useAuth();
  const {
    isRunning,
    isPaused,
    timeLeft,
    totalDuration,
    sessionType,
    cycleCount,
    activeTaskId,
    activeTaskTitle,
    startFocus,
    startBreak,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeTimer,
    skipSession,
  } = useFocus();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTaskId || '');

  useEffect(() => {
    tasksApi.getTasks({ status: 'todo' }).then(setTasks).catch(() => {});
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maxCycles = settings?.pomodoro_sessions_before_long_break || 4;

  // SVG Ring calculation
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const handleStart = () => {
    if (isPaused) {
      resumeTimer();
    } else {
      const selectedTask = tasks.find((t) => t.id === selectedTaskId);
      startFocus(selectedTaskId || null, selectedTask?.title || null);
    }
  };

  const handleSelectMode = (type: FocusSessionType) => {
    if (isRunning) return;
    if (type === 'work') startFocus(selectedTaskId || null);
    else if (type === 'short_break') startBreak(false);
    else if (type === 'long_break') startBreak(true);
  };

  const ringColors: Record<FocusSessionType, { stroke: string; glow: string; text: string }> = {
    work: { stroke: '#6366f1', glow: 'rgba(99, 102, 241, 0.3)', text: 'text-indigo-600 dark:text-indigo-400' },
    short_break: { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-600 dark:text-emerald-400' },
    long_break: { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', text: 'text-blue-600 dark:text-blue-400' },
  };

  const curColor = ringColors[sessionType];

  return (
    <div className="flex flex-col items-center">
      {/* Session Mode Selector Pills */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 p-1.5 border border-white/20 mb-8 backdrop-blur-md shadow-xs">
        <button
          type="button"
          onClick={() => handleSelectMode('work')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            sessionType === 'work'
              ? 'bg-[#4880ec] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Pomodoro ({settings?.pomodoro_work_mins || 25}m)
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode('short_break')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            sessionType === 'short_break'
              ? 'bg-[#4880ec] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Short Break ({settings?.pomodoro_short_break_mins || 5}m)
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode('long_break')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            sessionType === 'long_break'
              ? 'bg-[#4880ec] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Long Break ({settings?.pomodoro_long_break_mins || 15}m)
        </button>
      </div>

      {/* Circular SVG Timer */}
      <div className="relative flex items-center justify-center">
        <svg className="h-[320px] w-[320px] -rotate-90 transform">
          {/* Background Track */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke={curColor.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
              filter: isRunning ? `drop-shadow(0 0 16px ${curColor.glow})` : undefined,
            }}
          />
        </svg>

        {/* Center Countdown & Details */}
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
            {formatTimer(timeLeft)}
          </span>
          <span className={`mt-2 text-xs font-bold uppercase tracking-widest ${curColor.text}`}>
            {sessionType.replace('_', ' ')}
          </span>

          {/* Active Task Name if linked */}
          {activeTaskTitle ? (
            <p className="mt-2 max-w-[200px] truncate text-xs font-semibold text-white/80">
              {activeTaskTitle}
            </p>
          ) : (
            <p className="mt-2 text-xs text-white/50">
              Stay in flow
            </p>
          )}
        </div>
      </div>

      {/* Cycle Dots */}
      <div className="flex items-center gap-2 mt-6">
        <span className="text-[11px] font-medium text-white/50 mr-1">Cycle:</span>
        {Array.from({ length: maxCycles }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              i + 1 < cycleCount
                ? 'bg-[#4880ec]'
                : i + 1 === cycleCount
                ? 'bg-[#4880ec] ring-4 ring-blue-500/30'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Primary Timer Controls */}
      <div className="flex items-center gap-3 mt-8">
        {!isRunning || isPaused ? (
          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-2 rounded-2xl bg-[#4880ec] hover:bg-[#3b71db] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/40 active:scale-95 transition"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>{isPaused ? 'Resume' : 'Start Focus'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={pauseTimer}
            className="flex items-center gap-2 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 px-8 py-3.5 text-base font-bold text-white shadow-lg active:scale-95 transition backdrop-blur-md"
          >
            <Pause className="h-5 w-5 fill-current" />
            <span>Pause</span>
          </button>
        )}

        {isRunning && (
          <>
            <button
              type="button"
              onClick={completeTimer}
              title="Complete Session"
              className="rounded-2xl border border-white/20 bg-emerald-500/20 p-3.5 text-emerald-300 shadow-sm hover:bg-emerald-500/30 backdrop-blur-md transition"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={skipSession}
              title="Skip Session"
              className="rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white/70 shadow-sm hover:bg-white/20 backdrop-blur-md transition"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={stopTimer}
              title="Cancel / Stop"
              className="rounded-2xl border border-white/20 bg-rose-500/20 p-3.5 text-rose-300 shadow-sm hover:bg-rose-500/30 backdrop-blur-md transition"
            >
              <Square className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Link to Task Dropdown */}
      {!isRunning && (
        <div className="mt-8 w-full max-w-sm text-left">
          <label className="text-xs font-semibold text-white/70 mb-1.5 block">
            Associate session with a task:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white backdrop-blur-md shadow-xs focus:outline-none focus:border-white cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-white">No task (General focus)</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id} className="bg-slate-900 text-white">
                {task.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
