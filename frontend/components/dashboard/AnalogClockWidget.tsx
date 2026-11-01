'use client';

import React, { useState, useEffect } from 'react';

interface AnalogClockWidgetProps {
  className?: string;
}

export function AnalogClockWidget({ className = '' }: AnalogClockWidgetProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Default to 4:00 PM if not yet hydrated to prevent SSR mismatch
  const now = time || new Date(2024, 6, 17, 16, 0, 0);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Calculate hand angles in degrees
  const secondDeg = seconds * 6; // 360 / 60
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  // Format digital string matching screenshot e.g. "4pm" or "4:30pm"
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHour = minutes === 0 ? `${hour12}${ampm}` : `${hour12}:${String(minutes).padStart(2, '0')}${ampm}`;

  // Format date string matching screenshot: "Wed, 17th July"
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = now.getDate();
  const getOrdinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const displayDate = `${dayName}, ${dayNum}${getOrdinalSuffix(dayNum)} ${monthName}`;

  // 12 hour ticks
  const ticks = Array.from({ length: 12 }).map((_, i) => i * 30);

  return (
    <div
      className={`rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4 transition-all ${className}`}
    >
      {/* Analog Clock Face */}
      <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* Outer Ring */}
          <circle
            cx="50"
            cy="50"
            r="46"
            className="fill-white/60 dark:fill-slate-800/40 stroke-slate-200/80 dark:stroke-slate-700/60"
            strokeWidth="1.5"
          />

          {/* Hour Tick Marks matching screenshot */}
          {ticks.map((deg, i) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const isQuarter = i % 3 === 0;
            const length = isQuarter ? 6 : 3.5;
            const r1 = 43;
            const r2 = r1 - length;
            const x1 = 50 + r1 * Math.cos(rad);
            const y1 = 50 + r1 * Math.sin(rad);
            const x2 = 50 + r2 * Math.cos(rad);
            const y2 = 50 + r2 * Math.sin(rad);

            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={isQuarter ? 'stroke-slate-800 dark:stroke-slate-200' : 'stroke-slate-400/80 dark:stroke-slate-500'}
                strokeWidth={isQuarter ? 1.5 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* Hour Hand */}
          <line
            x1="50"
            y1="50"
            x2={50 + 24 * Math.cos(((hourDeg - 90) * Math.PI) / 180)}
            y2={50 + 24 * Math.sin(((hourDeg - 90) * Math.PI) / 180)}
            className="stroke-slate-900 dark:stroke-slate-100"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Minute Hand */}
          <line
            x1="50"
            y1="50"
            x2={50 + 34 * Math.cos(((minuteDeg - 90) * Math.PI) / 180)}
            y2={50 + 34 * Math.sin(((minuteDeg - 90) * Math.PI) / 180)}
            className="stroke-slate-900 dark:stroke-slate-100"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Second Hand (delicate light blue line matching screenshot) */}
          <line
            x1="50"
            y1="50"
            x2={50 + 38 * Math.cos(((secondDeg - 90) * Math.PI) / 180)}
            y2={50 + 38 * Math.sin(((secondDeg - 90) * Math.PI) / 180)}
            className="stroke-sky-500 dark:stroke-sky-400"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Center Pin */}
          <circle cx="50" cy="50" r="3" className="fill-slate-900 dark:fill-white" />
          <circle cx="50" cy="50" r="1.2" className="fill-white dark:fill-slate-900" />
        </svg>
      </div>

      {/* Large Typography matching screenshot */}
      <div className="flex flex-col items-start pr-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {displayHour}
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          {displayDate}
        </p>
      </div>
    </div>
  );
}
