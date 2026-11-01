'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { FocusSessionType, FocusSession } from '@/types';
import { focusApi } from '@/lib/api/focus';
import { useAuth } from './AuthContext';

interface FocusContextType {
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  totalDuration: number;
  sessionType: FocusSessionType;
  cycleCount: number;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  currentSession: FocusSession | null;
  startFocus: (taskId?: string | null, taskTitle?: string | null, durationMinutes?: number) => Promise<void>;
  startBreak: (isLong?: boolean) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  completeTimer: () => Promise<void>;
  skipSession: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

function playZenChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.8);
  } catch {
    // Audio context not allowed or supported
  }
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [sessionType, setSessionType] = useState<FocusSessionType>('work');
  const [cycleCount, setCycleCount] = useState(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  const workMins = settings?.pomodoro_work_mins || 25;
  const shortBreakMins = settings?.pomodoro_short_break_mins || 5;
  const longBreakMins = settings?.pomodoro_long_break_mins || 15;
  const maxCycles = settings?.pomodoro_sessions_before_long_break || 4;

  const handleSessionComplete = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setIsPaused(false);

    playZenChime();

    if (sessionType === 'work') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
      });
    }

    if (currentSession?.id) {
      try {
        await focusApi.completeSession(currentSession.id);
      } catch {
        // Ignore
      }
    }

    if (sessionType === 'work') {
      const nextCycle = cycleCount >= maxCycles ? 1 : cycleCount + 1;
      setCycleCount(nextCycle);
      const isLong = cycleCount >= maxCycles;
      const breakSecs = (isLong ? longBreakMins : shortBreakMins) * 60;
      setSessionType(isLong ? 'long_break' : 'short_break');
      setTimeLeft(breakSecs);
      setTotalDuration(breakSecs);
    } else {
      setSessionType('work');
      const workSecs = workMins * 60;
      setTimeLeft(workSecs);
      setTotalDuration(workSecs);
    }
    setCurrentSession(null);
  }, [cycleCount, currentSession, maxCycles, sessionType, workMins, shortBreakMins, longBreakMins]);

  // Sync timer duration if settings change while idle
  useEffect(() => {
    if (!isRunning && !isPaused) {
      if (sessionType === 'work') {
        const secs = (settings?.pomodoro_work_mins || 25) * 60;
        setTimeLeft(secs);
        setTotalDuration(secs);
      } else if (sessionType === 'short_break') {
        const secs = (settings?.pomodoro_short_break_mins || 5) * 60;
        setTimeLeft(secs);
        setTotalDuration(secs);
      } else if (sessionType === 'long_break') {
        const secs = (settings?.pomodoro_long_break_mins || 15) * 60;
        setTimeLeft(secs);
        setTotalDuration(secs);
      }
    }
  }, [settings?.pomodoro_work_mins, settings?.pomodoro_short_break_mins, settings?.pomodoro_long_break_mins, isRunning, isPaused, sessionType]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleSessionComplete();
          }
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, handleSessionComplete]);

  const startFocus = async (taskId?: string | null, taskTitle?: string | null, durationMinutes?: number) => {
    const mins = durationMinutes || workMins;
    const durationSeconds = mins * 60;

    setActiveTaskId(taskId || null);
    setActiveTaskTitle(taskTitle || null);
    setSessionType('work');
    setTotalDuration(durationSeconds);
    setTimeLeft(durationSeconds);
    setIsRunning(true);
    setIsPaused(false);
    endTimeRef.current = Date.now() + durationSeconds * 1000;

    try {
      const session = await focusApi.startSession({
        session_type: 'work',
        planned_duration_seconds: durationSeconds,
        task: taskId || undefined,
        session_number_in_cycle: cycleCount,
      });
      setCurrentSession(session);
    } catch {
      // Offline / fallback mode
    }
  };

  const startBreak = async (isLong = false) => {
    const mins = isLong ? longBreakMins : shortBreakMins;
    const durationSeconds = mins * 60;

    setSessionType(isLong ? 'long_break' : 'short_break');
    setTotalDuration(durationSeconds);
    setTimeLeft(durationSeconds);
    setIsRunning(true);
    setIsPaused(false);
    endTimeRef.current = Date.now() + durationSeconds * 1000;

    try {
      const session = await focusApi.startSession({
        session_type: isLong ? 'long_break' : 'short_break',
        planned_duration_seconds: durationSeconds,
        session_number_in_cycle: cycleCount,
      });
      setCurrentSession(session);
    } catch {
      // Ignore
    }
  };

  const pauseTimer = () => {
    setIsPaused(true);
    endTimeRef.current = null;
  };

  const resumeTimer = () => {
    setIsPaused(false);
    endTimeRef.current = Date.now() + timeLeft * 1000;
  };

  const stopTimer = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    endTimeRef.current = null;

    if (currentSession?.id) {
      try {
        await focusApi.interruptSession(currentSession.id);
      } catch {
        // Ignore
      }
    }
    setCurrentSession(null);
    const defaultSecs = workMins * 60;
    setTimeLeft(defaultSecs);
    setTotalDuration(defaultSecs);
    setSessionType('work');
  };

  const completeTimer = async () => {
    await handleSessionComplete();
  };

  const skipSession = () => {
    stopTimer();
    if (sessionType === 'work') {
      const isLong = cycleCount >= maxCycles;
      setSessionType(isLong ? 'long_break' : 'short_break');
      const breakSecs = (isLong ? longBreakMins : shortBreakMins) * 60;
      setTimeLeft(breakSecs);
      setTotalDuration(breakSecs);
    } else {
      setSessionType('work');
      const workSecs = workMins * 60;
      setTimeLeft(workSecs);
      setTotalDuration(workSecs);
    }
  };

  return (
    <FocusContext.Provider
      value={{
        isRunning,
        isPaused,
        timeLeft,
        totalDuration,
        sessionType,
        cycleCount,
        activeTaskId,
        activeTaskTitle,
        currentSession,
        startFocus,
        startBreak,
        pauseTimer,
        resumeTimer,
        stopTimer,
        completeTimer,
        skipSession,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
