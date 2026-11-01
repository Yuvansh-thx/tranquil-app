'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserSettings } from '@/types';
import { authApi, LoginPayload, RegisterPayload } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  timezone: 'UTC',
  pomodoro_work_mins: 25,
  pomodoro_short_break_mins: 5,
  pomodoro_long_break_mins: 15,
  pomodoro_sessions_before_long_break: 4,
  theme: 'dark',
  sidebar_collapsed: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('tranquil_theme', theme);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tranquil_theme') as 'light' | 'dark' | 'system' | null;
      if (stored) {
        applyTheme(stored);
      }
    } catch {
      // Ignore
    }
  }, [applyTheme]);

  const fetchUserAndSettings = useCallback(async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
      try {
        const settingsData = await authApi.getSettings();
        setSettings(settingsData);
        applyTheme(settingsData.theme);
      } catch {
        setSettings(defaultSettings);
        const stored = (typeof window !== 'undefined' && localStorage.getItem('tranquil_theme') as 'light' | 'dark' | 'system') || 'dark';
        applyTheme(stored);
      }
    } catch {
      setUser(null);
      setSettings(defaultSettings);
      const stored = (typeof window !== 'undefined' && localStorage.getItem('tranquil_theme') as 'light' | 'dark' | 'system') || 'dark';
      applyTheme(stored);
    } finally {
      setIsLoading(false);
    }
  }, [applyTheme]);

  useEffect(() => {
    fetchUserAndSettings();
  }, [fetchUserAndSettings]);

  const login = async (data: LoginPayload) => {
    const res = await authApi.login(data);
    setUser(res.user);
    try {
      const s = await authApi.getSettings();
      setSettings(s);
      applyTheme(s.theme);
    } catch {
      setSettings(defaultSettings);
    }
  };

  const register = async (data: RegisterPayload) => {
    const res = await authApi.register(data);
    setUser(res.user);
    try {
      const s = await authApi.getSettings();
      setSettings(s);
      applyTheme(s.theme);
    } catch {
      setSettings(defaultSettings);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore
    } finally {
      setUser(null);
    }
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    if (!settings) return;
    try {
      const updated = await authApi.updateSettings(data);
      setSettings(updated);
      if (data.theme) {
        applyTheme(data.theme);
      }
    } catch {
      setSettings({ ...settings, ...data });
      if (data.theme) applyTheme(data.theme);
    }
  };

  const toggleTheme = async () => {
    const isCurrentlyDark =
      typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark')
        : settings?.theme !== 'light';
    const nextTheme: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    setSettings((prev) => (prev ? { ...prev, theme: nextTheme } : { ...defaultSettings, theme: nextTheme }));
    try {
      await updateSettings({ theme: nextTheme });
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        login,
        register,
        logout,
        updateSettings,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
