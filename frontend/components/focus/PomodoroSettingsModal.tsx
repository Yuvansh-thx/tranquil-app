'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Timer, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PomodoroSettingsModal({ isOpen, onClose }: PomodoroSettingsModalProps) {
  const { settings, updateSettings } = useAuth();

  const [workMins, setWorkMins] = useState(25);
  const [shortBreakMins, setShortBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [cycles, setCycles] = useState(4);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setWorkMins(settings.pomodoro_work_mins || 25);
      setShortBreakMins(settings.pomodoro_short_break_mins || 5);
      setLongBreakMins(settings.pomodoro_long_break_mins || 15);
      setCycles(settings.pomodoro_sessions_before_long_break || 4);
    }
  }, [settings, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        pomodoro_work_mins: Math.max(1, Number(workMins)),
        pomodoro_short_break_mins: Math.max(1, Number(shortBreakMins)),
        pomodoro_long_break_mins: Math.max(1, Number(longBreakMins)),
        pomodoro_sessions_before_long_break: Math.max(1, Number(cycles)),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch {
      // Ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-white/20 bg-slate-900/90 dark:bg-slate-950/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl z-10 space-y-6 animate-scale-in">
        {/* Header with Close Button */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
              <Settings className="h-6 w-6 text-sky-400" />
              Settings &amp; Preferences
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-white/60">
              Personalize your Pomodoro timer cycles and focus sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/60 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/50 backdrop-blur-xl p-3 text-xs font-semibold text-emerald-300 shadow-lg animate-fade-in">
            <Check className="h-4 w-4" />
            <span>Preferences updated successfully!</span>
          </div>
        )}

        {/* Card for Focus & Pomodoro Timer */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Focus &amp; Pomodoro Timer
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1.5">
                  Work Session (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={workMins}
                  onChange={(e) => setWorkMins(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-blue-400 focus:outline-none backdrop-blur-md"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1.5">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shortBreakMins}
                  onChange={(e) => setShortBreakMins(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-blue-400 focus:outline-none backdrop-blur-md"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1.5">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={longBreakMins}
                  onChange={(e) => setLongBreakMins(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-blue-400 focus:outline-none backdrop-blur-md"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1.5">
                  Work Sessions before Long Break
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={cycles}
                  onChange={(e) => setCycles(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-blue-400 focus:outline-none backdrop-blur-md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#4880ec] hover:bg-[#3b6edc] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
