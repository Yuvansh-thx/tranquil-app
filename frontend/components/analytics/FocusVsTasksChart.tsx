'use client';

import React, { useState, useMemo } from 'react';
import { Timer, CheckCircle2, TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { DailyActivityRecord } from '@/types';

interface FocusVsTasksChartProps {
  dailyData: DailyActivityRecord[];
  days: number;
  onPeriodChange?: (days: number) => void;
  className?: string;
}

export function FocusVsTasksChart({
  dailyData,
  days,
  onPeriodChange,
  className = '',
}: FocusVsTasksChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Take the most recent `days` items
  const slicedData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];
    return dailyData.slice(-days);
  }, [dailyData, days]);

  // Compute maximum values for scaling
  const maxFocusHours = useMemo(() => {
    const maxVal = Math.max(2, ...slicedData.map((d) => d.focus_hours));
    return Math.ceil(maxVal * 1.2 * 2) / 2; // Nice ceiling
  }, [slicedData]);

  const maxTasks = useMemo(() => {
    const maxVal = Math.max(3, ...slicedData.map((d) => d.tasks_completed));
    return Math.ceil(maxVal * 1.2);
  }, [slicedData]);

  // Aggregate stats for period
  const totals = useMemo(() => {
    let focusHours = 0;
    let focusMinutes = 0;
    let tasks = 0;
    let activeDays = 0;

    slicedData.forEach((d) => {
      focusHours += d.focus_hours;
      focusMinutes += d.focus_minutes;
      tasks += d.tasks_completed;
      if (d.focus_minutes > 0 || d.tasks_completed > 0) {
        activeDays++;
      }
    });

    const avgFocus = slicedData.length > 0 ? (focusHours / slicedData.length).toFixed(1) : '0';
    const avgTasks = slicedData.length > 0 ? (tasks / slicedData.length).toFixed(1) : '0';

    return {
      focusHours: Number(focusHours.toFixed(1)),
      focusMinutes,
      tasks,
      activeDays,
      avgFocus,
      avgTasks,
    };
  }, [slicedData]);

  const activeHoverItem = hoveredIdx !== null ? slicedData[hoveredIdx] : null;

  return (
    <div
      className={`rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl ${className}`}
    >
      {/* Header and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-sky-400" />
              Focus Hours vs. Tasks Completed
            </h3>
            <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300 border border-sky-400/30">
              Comparative Graph
            </span>
          </div>
          <p className="mt-1 text-xs text-white/70">
            Compare intentional focus duration with actual task completion velocity.
          </p>
        </div>

        {/* Period Selector Tabs */}
        {onPeriodChange && (
          <div className="flex items-center gap-1 rounded-2xl bg-white/10 p-1 border border-white/20 backdrop-blur-md self-start sm:self-auto">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onPeriodChange(d)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                  days === d
                    ? 'bg-[#4880ec] text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Total Focus */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Total Focus
            </span>
            <Timer className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {totals.focusHours}
            <span className="text-xs font-normal text-white/50 ml-1">hrs</span>
          </p>
          <p className="text-[11px] text-white/60 mt-0.5">
            Avg {totals.avgFocus} hrs/day
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Tasks Done
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {totals.tasks}
            <span className="text-xs font-normal text-white/50 ml-1">tasks</span>
          </p>
          <p className="text-[11px] text-white/60 mt-0.5">
            Avg {totals.avgTasks} tasks/day
          </p>
        </div>

        {/* Active Days */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Active Days
            </span>
            <Calendar className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {totals.activeDays}
            <span className="text-xs font-normal text-white/50 ml-1">/ {slicedData.length}</span>
          </p>
          <p className="text-[11px] text-white/60 mt-0.5">
            {slicedData.length > 0 ? Math.round((totals.activeDays / slicedData.length) * 100) : 0}% active
          </p>
        </div>

        {/* Ratio / Productivity Index */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Focus per Task
            </span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {totals.tasks > 0
              ? `${Math.round(totals.focusMinutes / totals.tasks)}m`
              : '—'}
          </p>
          <p className="text-[11px] text-white/60 mt-0.5">
            Deep work pace
          </p>
        </div>
      </div>

      {/* Legend & Hover Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
        {/* Dual Series Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <span className="h-3 w-3 rounded-xs bg-indigo-500 shadow-2xs" />
            <span>Focus Hours</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-3 w-3 rounded-xs bg-emerald-500 shadow-2xs" />
            <span>Tasks Completed</span>
          </div>
        </div>

        {/* Dynamic Hover Details */}
        {activeHoverItem ? (
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3 animate-fade-in">
            <span className="text-slate-400">{activeHoverItem.date}</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              ⏱️ {activeHoverItem.focus_hours} hrs ({activeHoverItem.focus_minutes}m)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              ✅ {activeHoverItem.tasks_completed} done
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Hover over any day for precise breakdown
          </div>
        )}
      </div>

      {/* Main Dual-Bar Chart Canvas */}
      <div className="h-64 w-full flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1 overflow-x-auto scrollbar-thin">
        {slicedData.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 italic">
            No activity records in this time frame
          </div>
        ) : (
          slicedData.map((item, idx) => {
            const focusPercent = Math.min(100, Math.max(4, (item.focus_hours / maxFocusHours) * 100));
            const tasksPercent = Math.min(100, Math.max(4, (item.tasks_completed / maxTasks) * 100));
            const shortDate = item.date.slice(5); // MM-DD
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex-1 min-w-[20px] max-w-[48px] flex flex-col items-center gap-1.5 group cursor-pointer transition-all duration-200 ${
                  isHovered ? 'scale-105' : ''
                }`}
              >
                {/* Micro hover values */}
                <div
                  className={`text-[9px] font-bold tracking-tight text-center transition-opacity flex items-center justify-center gap-1 ${
                    isHovered ? 'opacity-100 text-slate-700 dark:text-slate-200' : 'opacity-0'
                  }`}
                >
                  <span className="text-indigo-500">{item.focus_hours}h</span>
                  <span className="text-emerald-500">{item.tasks_completed}</span>
                </div>

                {/* Paired Bar Columns */}
                <div
                  className={`w-full h-44 rounded-xl p-1 flex items-end justify-center gap-1 transition-colors ${
                    isHovered
                      ? 'bg-slate-100/90 dark:bg-slate-800'
                      : 'bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  {/* Left Bar: Focus Hours (Indigo) */}
                  <div className="flex-1 h-full flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        item.focus_hours > 0
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300 shadow-2xs group-hover:brightness-110'
                          : 'bg-slate-200/50 dark:bg-slate-700/30'
                      }`}
                      style={{ height: `${item.focus_hours > 0 ? focusPercent : 4}%` }}
                    />
                  </div>

                  {/* Right Bar: Tasks Completed (Emerald) */}
                  <div className="flex-1 h-full flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        item.tasks_completed > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300 shadow-2xs group-hover:brightness-110'
                          : 'bg-slate-200/50 dark:bg-slate-700/30'
                      }`}
                      style={{ height: `${item.tasks_completed > 0 ? tasksPercent : 4}%` }}
                    />
                  </div>
                </div>

                {/* X-axis date label */}
                <span
                  className={`text-[9px] font-medium truncate w-full text-center transition-colors ${
                    isHovered
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {shortDate}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
