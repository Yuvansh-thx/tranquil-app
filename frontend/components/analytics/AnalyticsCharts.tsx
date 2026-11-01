'use client';

import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Timer,
  TrendingUp,
  Flame,
  Flag,
  Award,
} from 'lucide-react';
import {
  AnalyticsOverview,
  TaskAnalytics,
  FocusAnalytics,
  ActivityAnalyticsResponse,
} from '@/types';
import { ActivityHeatmap } from './ActivityHeatmap';
import { FocusVsTasksChart } from './FocusVsTasksChart';

interface AnalyticsChartsProps {
  overview: AnalyticsOverview | null;
  taskData: TaskAnalytics | null;
  focusData: FocusAnalytics | null;
  activityData: ActivityAnalyticsResponse | null;
  days: number;
  onDaysChange: (days: number) => void;
}

export function AnalyticsCharts({
  overview,
  taskData,
  focusData,
  activityData,
  days,
  onDaysChange,
}: AnalyticsChartsProps) {
  const priorityColors: Record<string, { bg: string; fill: string; text: string }> = {
    urgent: { bg: 'bg-rose-500', fill: '#f43f5e', text: 'text-rose-500' },
    high: { bg: 'bg-amber-500', fill: '#f59e0b', text: 'text-amber-500' },
    medium: { bg: 'bg-indigo-500', fill: '#6366f1', text: 'text-indigo-500' },
    low: { bg: 'bg-slate-400', fill: '#94a3b8', text: 'text-slate-400' },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Stat Cards in Frosted Glass */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Focus Today */}
        <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl hover:border-white/25 transition">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Focus Today
            </span>
            <Timer className="h-4 w-4" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {overview?.focus_minutes_today || 0}
            <span className="text-xs font-normal text-white/50 ml-1">mins</span>
          </p>
          <p className="mt-1 text-[11px] text-white/60">
            {overview?.focus_sessions_today || 0} completed sessions
          </p>
        </div>

        {/* Tasks Completed Today */}
        <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl hover:border-white/25 transition">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Done Today
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {overview?.tasks_completed_today || 0}
          </p>
          <p className="mt-1 text-[11px] text-white/60">
            {overview?.tasks_completed_this_week || 0} completed this week
          </p>
        </div>

        {/* Current Active Streak */}
        <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl hover:border-white/25 transition">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Active Streak
            </span>
            <Flame className="h-4 w-4" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {activityData?.summary?.current_streak || 0}
            <span className="text-xs font-normal text-white/50 ml-1">
              {(activityData?.summary?.current_streak || 0) === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-white/60">
            Best: {activityData?.summary?.longest_streak || 0} consecutive days
          </p>
        </div>

        {/* Session Adherence / Total Open */}
        <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl hover:border-white/25 transition">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Pending Attention
            </span>
            <Flag className="h-4 w-4" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {overview?.tasks_due_today || 0}
            <span className="text-xs font-normal text-rose-400 ml-1">
              ({overview?.tasks_overdue || 0} overdue)
            </span>
          </p>
          <p className="mt-1 text-[11px] text-white/60">
            Tasks due today
          </p>
        </div>
      </div>

      {/* GitHub-style Daily Contribution Heatmap Dashboard */}
      <ActivityHeatmap
        dailyData={activityData?.daily || []}
        summary={activityData?.summary || null}
      />

      {/* Comparative Graph: Hours Focused vs. Tasks Completed */}
      <FocusVsTasksChart
        dailyData={activityData?.daily || []}
        days={days}
        onPeriodChange={onDaysChange}
      />

      {/* Priority Breakdown (if tasks present) */}
      {taskData?.by_priority && taskData.by_priority.length > 0 && (
        <div className="rounded-[32px] border border-white/20 bg-white/[0.07] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Flag className="h-4 w-4 text-amber-400" />
            Completed Tasks by Priority
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {taskData.by_priority.map((p) => {
              const styling = priorityColors[p.priority] || priorityColors.medium;
              return (
                <div
                  key={p.priority}
                  className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-white/70">
                      {p.priority}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${styling.bg}`} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-white">
                    {p.count} <span className="text-xs font-normal text-white/50">tasks</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
