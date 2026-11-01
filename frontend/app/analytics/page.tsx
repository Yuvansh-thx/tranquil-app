'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { analyticsApi } from '@/lib/api/analytics';
import {
  AnalyticsOverview,
  TaskAnalytics,
  FocusAnalytics,
  ActivityAnalyticsResponse,
} from '@/types';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [days, setDays] = useState(14);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [taskData, setTaskData] = useState<TaskAnalytics | null>(null);
  const [focusData, setFocusData] = useState<FocusAnalytics | null>(null);
  const [activityData, setActivityData] = useState<ActivityAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [o, t, f, a] = await Promise.all([
        analyticsApi.getOverview().catch(() => null),
        analyticsApi.getTaskAnalytics(days).catch(() => null),
        analyticsApi.getFocusAnalytics(days).catch(() => null),
        analyticsApi.getActivityAnalytics(365).catch(() => null),
      ]);
      setOverview(o);
      setTaskData(t);
      setFocusData(f);
      setActivityData(a);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchAnalytics();
    }
  }, [user, isLoading, router, fetchAnalytics]);

  if (isLoading || (loading && !user)) {
    return (
      <div className="flex h-64 items-center justify-center text-white/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
            <BarChart3 className="h-6 w-6 text-sky-400" />
            Productivity Analytics &amp; Activity
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-white/60">
            Real metrics calculated directly from your completed tasks and focus sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAnalytics()}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-white/20 backdrop-blur-md active:scale-95 transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-sky-300" />
          <span>Refresh</span>
        </button>
      </div>

      <AnalyticsCharts
        overview={overview}
        taskData={taskData}
        focusData={focusData}
        activityData={activityData}
        days={days}
        onDaysChange={setDays}
      />
    </div>
  );
}
