'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface VisibilityEyeButtonProps {
  visible: boolean;
  label: string;
  onToggle: () => void;
  size?: 'sm' | 'md';
  showHiddenBadge?: boolean;
  className?: string;
}

export function VisibilityEyeButton({
  visible,
  label,
  onToggle,
  size = 'sm',
  showHiddenBadge = true,
  className = ''
}: VisibilityEyeButtonProps) {
  const iconCls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      {!visible && showHiddenBadge && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25">
          Hidden
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={!visible}
        title={visible ? `Hide ${label} from visitors` : `Show ${label} to visitors`}
        data-testid={`visibility-toggle-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        className={`inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
          size === 'md' ? 'w-8 h-8' : 'w-7 h-7'
        } ${
          visible
            ? 'border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
        }`}
      >
        {visible ? <Eye className={iconCls} /> : <EyeOff className={iconCls} />}
      </button>
    </div>
  );
}
