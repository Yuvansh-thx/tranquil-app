'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  textColor?: string;
  isGlowing?: boolean;
}

export function BrandLogoIcon({
  size = 'md',
  isGlowing = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  isGlowing?: boolean;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];

  const svgSize = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  }[size];

  return (
    <div
      className={`relative flex ${sizeClasses} items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-300 shadow-md transition-all duration-300 group-hover:scale-105 ${
        isGlowing
          ? 'border-2 border-white/80 bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.45)] text-white'
          : 'border border-white/20'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${svgSize} drop-shadow-sm`}
      >
        {/* Outer circular ring */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Inner tranquil arch / dome */}
        <path
          d="M7.5 14C7.5 11.5147 9.51472 9.5 12 9.5C14.4853 9.5 16.5 11.5147 16.5 14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Baseline horizon */}
        <path
          d="M3.5 16H20.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  className = '',
  size = 'md',
  showName = true,
  textColor,
  isGlowing = false,
}: BrandLogoProps) {
  const textSize = {
    sm: 'text-sm font-bold',
    md: 'text-base sm:text-lg font-extrabold',
    lg: 'text-xl sm:text-2xl font-black',
  }[size];

  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 transition-opacity hover:opacity-95 ${className}`}
      title="Tranquil — An All-in-One Productivity System"
    >
      <BrandLogoIcon size={size} isGlowing={isGlowing} />
      {showName && (
        <span
          className={`tracking-tight drop-shadow-xs transition-colors ${textSize} ${
            textColor || 'text-slate-900 dark:text-white'
          }`}
        >
          Tranquil
        </span>
      )}
    </Link>
  );
}
