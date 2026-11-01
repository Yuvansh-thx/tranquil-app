'use client';

import React, { useState, useMemo } from 'react';
import { Flame, Trophy, Calendar, CheckCircle2, Timer, Sparkles } from 'lucide-react';
import { DailyActivityRecord, ActivitySummary } from '@/types';

interface ActivityHeatmapProps {
  dailyData: DailyActivityRecord[];
  summary: ActivitySummary | null;
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  record: DailyActivityRecord | null;
  dayName: string;
  formattedDate: string;
}

export function ActivityHeatmap({ dailyData, summary, className = '' }: ActivityHeatmapProps) {
  const [viewWeeks, setViewWeeks] = useState<52 | 26 | 12>(52);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    record: null,
    dayName: '',
    formattedDate: '',
  });

  // Map dailyData by YYYY-MM-DD for O(1) lookup
  const dataByDate = useMemo(() => {
    const map = new Map<string, DailyActivityRecord>();
    dailyData.forEach((rec) => map.set(rec.date, rec));
    return map;
  }, [dailyData]);

  // Generate grid columns (weeks)
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    // Normalize to midnight
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
    const numWeeks = viewWeeks;
    const totalDays = (numWeeks - 1) * 7 + dayOfWeek + 1;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1));

    const weeksList: { date: Date; dateStr: string; record: DailyActivityRecord }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];

    let currentWeek: { date: Date; dateStr: string; record: DailyActivityRecord }[] = [];
    let lastMonth = -1;

    const curr = new Date(startDate);
    let weekIndex = 0;

    while (curr <= today) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const existingRecord = dataByDate.get(dateStr);
      const record: DailyActivityRecord = existingRecord || {
        date: dateStr,
        tasks_completed: 0,
        focus_hours: 0,
        focus_minutes: 0,
        level: 0,
      };

      currentWeek.push({
        date: new Date(curr),
        dateStr,
        record,
      });

      // Track month transitions for header labels (on Sundays or first day of week)
      if (curr.getDay() === 0) {
        const currMonth = curr.getMonth();
        if (currMonth !== lastMonth) {
          const monthShort = curr.toLocaleDateString('en-US', { month: 'short' });
          months.push({ label: monthShort, weekIndex });
          lastMonth = currMonth;
        }
      }

      if (curr.getDay() === 6 || curr.getTime() === today.getTime()) {
        weeksList.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    return { weeks: weeksList, monthLabels: months };
  }, [viewWeeks, dataByDate]);

  // Color mapping for levels 0 to 4 (GitHub contribution style)
  const getLevelClasses = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#9be9a8] dark:bg-[#0e4429] border-[#7ecb8a] dark:border-[#0e4429] shadow-xs';
      case 2:
        return 'bg-[#40c463] dark:bg-[#006d32] border-[#34a552] dark:border-[#006d32] shadow-xs';
      case 3:
        return 'bg-[#30a14e] dark:bg-[#26a641] border-[#25813d] dark:border-[#26a641] shadow-xs';
      case 4:
        return 'bg-[#216e39] dark:bg-[#39d353] border-[#18552b] dark:border-[#39d353] shadow-sm shadow-emerald-500/20';
      case 0:
      default:
        return 'bg-slate-100 dark:bg-[#161b22] border-slate-200/80 dark:border-slate-800/80';
    }
  };

  const handleCellHover = (
    e: React.MouseEvent<HTMLDivElement>,
    record: DailyActivityRecord,
    date: Date
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      record,
      dayName,
      formattedDate,
    });
  };

  const handleCellLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div
      className={`relative rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Daily Activity Dashboard
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
              Contribution Graph
            </span>
          </div>
          <p className="mt-1 text-xs text-white/70">
            Green blocks darken as you complete more tasks and focus hours.
          </p>
        </div>

        {/* View Period Selector */}
        <div className="flex items-center gap-1 rounded-2xl bg-white/10 p-1 border border-white/20 backdrop-blur-md self-start sm:self-auto">
          {[
            { label: '3 Months', value: 12 },
            { label: '6 Months', value: 26 },
            { label: '1 Year', value: 52 },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setViewWeeks(item.value as 52 | 26 | 12)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                viewWeeks === item.value
                  ? 'bg-[#4880ec] text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Streak and Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Current Streak */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Current Streak
            </span>
            <Flame className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {summary?.current_streak || 0}
            <span className="text-xs font-normal text-white/50 ml-1">
              {(summary?.current_streak || 0) === 1 ? 'day' : 'days'}
            </span>
          </p>
        </div>

        {/* Longest Streak */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Longest Streak
            </span>
            <Trophy className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {summary?.longest_streak || 0}
            <span className="text-xs font-normal text-white/50 ml-1">
              {(summary?.longest_streak || 0) === 1 ? 'day' : 'days'}
            </span>
          </p>
        </div>

        {/* Total Active Days */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Active Days
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {summary?.total_active_days || 0}
            <span className="text-xs font-normal text-white/50 ml-1">days</span>
          </p>
        </div>

        {/* Total Hours in Period */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Focus Recorded
            </span>
            <Timer className="h-4 w-4" />
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-white">
            {summary?.total_focus_hours || 0}
            <span className="text-xs font-normal text-white/50 ml-1">hrs</span>
          </p>
        </div>
      </div>

      {/* Contribution Calendar Heatmap Grid */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-fit inline-block">
          {/* Month labels row */}
          <div className="flex text-[10px] font-medium text-slate-400 mb-1.5 pl-7 select-none">
            {weeks.map((_, weekIdx) => {
              const labelObj = monthLabels.find((m) => m.weekIndex === weekIdx);
              return (
                <div key={weekIdx} className="w-3.5 mr-1 text-left flex-shrink-0">
                  {labelObj ? (
                    <span className="truncate block font-semibold text-slate-500 dark:text-slate-400">
                      {labelObj.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Calendar Body: 7 rows with Day labels on left */}
          <div className="flex">
            {/* Day of week labels */}
            <div className="flex flex-col gap-1 pr-2 text-[9px] font-medium text-slate-400 select-none">
              {dayLabels.map((lbl, idx) => (
                <div key={idx} className="h-3.5 leading-[14px] w-5 text-right">
                  {lbl}
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1 flex-shrink-0">
                  {week.map((dayItem, dayIdx) => {
                    const levelClass = getLevelClasses(dayItem.record.level);
                    return (
                      <div
                        key={dayIdx}
                        onMouseEnter={(e) =>
                          handleCellHover(e, dayItem.record, dayItem.date)
                        }
                        onMouseLeave={handleCellLeave}
                        className={`h-3.5 w-3.5 rounded-[3px] border transition-all duration-150 cursor-pointer hover:scale-125 hover:z-20 ${levelClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2">
        <div className="text-[11px]">
          {summary?.total_tasks_completed || 0} tasks completed &amp; {summary?.total_focus_hours || 0} hours focused in the last {viewWeeks * 7} days
        </div>

        {/* GitHub "Less" to "More" scale */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[10px] text-slate-400">Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              className={`h-3 w-3 rounded-[2px] border ${getLevelClasses(lvl)}`}
            />
          ))}
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {tooltip.visible && tooltip.record && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full transform px-3 py-2 text-xs rounded-xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-700/80 dark:bg-slate-800/95 transition-all"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="font-semibold text-slate-200">
            {tooltip.dayName}, {tooltip.formattedDate}
          </div>
          {tooltip.record.tasks_completed > 0 || tooltip.record.focus_minutes > 0 ? (
            <div className="mt-1 space-y-0.5 text-[11px]">
              <div className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {tooltip.record.tasks_completed}{' '}
                  {tooltip.record.tasks_completed === 1 ? 'task' : 'tasks'} completed
                </span>
              </div>
              <div className="text-indigo-300 flex items-center gap-1 font-medium">
                <Timer className="h-3 w-3" />
                <span>
                  {tooltip.record.focus_hours} hrs ({tooltip.record.focus_minutes} mins) focused
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-slate-400 italic">
              No activity recorded
            </div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
        </div>
      )}
    </div>
  );
}
