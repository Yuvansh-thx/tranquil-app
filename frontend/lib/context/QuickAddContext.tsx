'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface QuickAddContextType {
  isOpen: boolean;
  activeTab: 'task' | 'note';
  openQuickAdd: (tab?: 'task' | 'note') => void;
  closeQuickAdd: () => void;
}

const QuickAddContext = createContext<QuickAddContextType | undefined>(undefined);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'note'>('task');

  const openQuickAdd = (tab: 'task' | 'note' = 'task') => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const closeQuickAdd = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        openQuickAdd('task');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QuickAddContext.Provider
      value={{
        isOpen,
        activeTab,
        openQuickAdd,
        closeQuickAdd,
      }}
    >
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}
