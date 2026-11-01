'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building2,
  MessageSquare,
  CheckSquare,
  FileText,
  Database,
  Timer,
  LogOut,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useFocus } from '@/lib/context/FocusContext';
import { BrandLogoIcon } from '@/components/shared/BrandLogo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, settings } = useAuth();
  const { isRunning } = useFocus();

  const dockItems = [
    {
      id: 'planner',
      label: 'Planner',
      href: '/',
      icon: Calendar,
      isTopBrand: true,
    },
    {
      id: 'upcoming',
      label: 'Upcoming & Alerts',
      href: '/upcoming',
      icon: Bell,
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: Building2,
    },
    {
      id: 'knowledge-graph',
      label: 'Knowledge Graph',
      href: '/knowledge-graph',
      icon: MessageSquare,
    },
    {
      id: 'tasks',
      label: "Todo's",
      href: '/tasks',
      icon: CheckSquare,
    },
    {
      id: 'notes',
      label: 'Notes',
      href: '/notes',
      icon: FileText,
    },
    {
      id: 'focus',
      label: 'Focus Timer',
      href: '/focus',
      icon: Timer,
      badge: isRunning,
    },
    {
      id: 'analytics',
      label: 'Analytics & Heatmap',
      href: '/analytics',
      icon: Database,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Iconic Left Vertical Dock Navigation matching screenshot */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-20 flex-col items-center justify-between border-r border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-950/75 py-5 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl z-50' : '-translate-x-full'
        }`}
      >
        {/* Top Dock Icon Stack */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Logo with Name on Top Left Corner */}
          <Link
            href="/"
            onClick={onClose}
            title="Tranquil"
            className="flex flex-col items-center gap-1 group pb-2.5 border-b border-slate-200/60 dark:border-white/10 w-full mb-0.5"
          >
            <BrandLogoIcon size="md" />
            <span className="text-[11px] font-extrabold tracking-tight text-slate-800 dark:text-white group-hover:text-sky-500 transition-colors">
              Tranquil
            </span>
          </Link>

          {dockItems.filter(item => !item.isTopBrand).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                title={item.label}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-300 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-white animate-pulse" />
                )}
                {/* Floating tooltip */}
                <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block z-50 whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom User Area */}
        <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-200/50 dark:border-white/10 w-full px-2">
          {user && (
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              className="group relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block z-50 whitespace-nowrap">
                Sign Out ({user.email})
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
