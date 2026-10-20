'use client';

import React from 'react';

export interface StatItem {
  value: string | number;
  label: string;
}

interface StatsRowProps {
  stats: StatItem[];
  className?: string;
}

export function StatsRow({ stats, className = '' }: StatsRowProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div
      className={`w-full grid grid-cols-3 gap-2 py-3 px-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-center ${className}`}
    >
      {stats.slice(0, 3).map((stat, idx) => (
        <div key={idx} className="flex flex-col items-center justify-center min-w-0 px-1">
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate w-full">
            {stat.value}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium truncate w-full">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
