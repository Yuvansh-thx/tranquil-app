'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarWidgetProps {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  className?: string;
  activeDates?: string[]; // Array of YYYY-MM-DD that have tasks
}

export function MiniCalendarWidget({
  selectedDate,
  onSelectDate,
  className = '',
  activeDates = [],
}: MiniCalendarWidgetProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Compute days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // In Europe/ISO standard as shown in screenshot: Monday = 0, Sunday = 6
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay < 0) startingDay = 6;

  const totalDays = lastDayOfMonth.getDate();

  const days: { dayNumber: number; dateStr: string; isCurrentMonth: boolean; date: Date }[] = [];

  // Empty leading slots from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    const dateStr = date.toISOString().split('T')[0];
    days.push({ dayNumber: d, dateStr, isCurrentMonth: false, date });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    days.push({ dayNumber: d, dateStr, isCurrentMonth: true, date });
  }

  // Trailing slots to complete grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const dateStr = date.toISOString().split('T')[0];
    days.push({ dayNumber: d, dateStr, isCurrentMonth: false, date });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div
      className={`rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {/* Month & Chevrons matching screenshot */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          {monthName}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayHeaders.map((dh) => (
          <span key={dh} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1">
            {dh}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((item, idx) => {
          const isToday = item.dateStr === todayStr;
          const isSelected = selectedDate && item.dateStr === selectedDate.toISOString().split('T')[0];
          const hasTask = activeDates.includes(item.dateStr);

          // Highlight matching screenshot: today / selected is a dark rounded squircle pill
          let styleClass = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60';
          if (!item.isCurrentMonth) {
            styleClass = 'text-slate-300 dark:text-slate-600 opacity-40';
          } else if (isToday || isSelected) {
            styleClass = 'bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-300 font-bold shadow-md';
          } else if (hasTask) {
            styleClass = 'bg-slate-200/80 dark:bg-slate-800/80 font-semibold text-slate-900 dark:text-white';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate && onSelectDate(item.date)}
              className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto flex items-center justify-center rounded-xl text-xs transition-all ${styleClass}`}
            >
              {item.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
