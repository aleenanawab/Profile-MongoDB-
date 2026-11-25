'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Lock, EyeOff, ArrowRight, Settings2, X } from 'lucide-react';
import { PrivacyTier } from '@/types/profile';

export interface SafetyCheckTarget {
  fieldKey: string;
  label: string;
  tier: 'private' | 'never_share';
  maskedPreview?: string;
  isSystemLocked?: boolean;
}

interface SafetyCheckPanelProps {
  target: SafetyCheckTarget | null;
  onClose: () => void;
  onConfirmPrivateInclude: (fieldKey: string) => void;
  onChangeFieldPrivacy?: (fieldKey: string, nextTier: PrivacyTier) => Promise<void> | void;
}

export function SafetyCheckPanel({
  target,
  onClose,
  onConfirmPrivateInclude,
  onChangeFieldPrivacy,
}: SafetyCheckPanelProps) {
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (target && panelRef.current && typeof panelRef.current.scrollIntoView === 'function') {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [target]);

  if (!target) return null;

  const isNeverShare = target.tier === 'never_share';

  const handleSetPrivate = async () => {
    if (!onChangeFieldPrivacy || target.isSystemLocked) return;
    setIsUpdatingTier(true);
    try {
      await onChangeFieldPrivacy(target.fieldKey, 'private');
      onClose();
    } finally {
      setIsUpdatingTier(false);
    }
  };

  return (
    <section
      ref={panelRef}
      id="safety-check-inline-panel"
      aria-live="polite"
      aria-labelledby="safety-check-title"
      className="rounded-2xl border-2 border-zinc-900 dark:border-white bg-white dark:bg-[#111111] p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in duration-150"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 text-zinc-950 dark:text-white">
            {isNeverShare ? <Lock className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
              Safety Check
            </div>
            <h3
              id="safety-check-title"
              className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white leading-snug"
            >
              {isNeverShare
                ? `${target.label} is set to Never Share`
                : `${target.label} is marked Private`}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {isNeverShare
                ? 'Sensitive or restricted fields remain permanently excluded from all presets, share links, QR codes, and exports.'
                : 'Private fields are excluded by default. Confirm explicitly if you want to include this field in the current share link.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss safety check"
          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-800 dark:text-zinc-200">
          {isNeverShare ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
            {target.label}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
            {target.maskedPreview || 'Protected'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] py-2 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-colors cursor-pointer"
        >
          {isNeverShare ? 'Keep it excluded' : 'Keep it private'}
        </button>

        {!isNeverShare && (
          <button
            type="button"
            onClick={() => {
              onConfirmPrivateInclude(target.fieldKey);
              onClose();
            }}
            className="min-h-[40px] py-2 px-4 rounded-xl border border-zinc-900 dark:border-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Include in this share link</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {isNeverShare && target.isSystemLocked && (
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
            Protected by platform Never Share policy — cannot be enabled for links or exports.
          </p>
        )}

        {isNeverShare && !target.isSystemLocked && onChangeFieldPrivacy && (
          <button
            type="button"
            disabled={isUpdatingTier}
            onClick={handleSetPrivate}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:underline px-2 py-1.5 cursor-pointer disabled:opacity-50"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isUpdatingTier ? 'Updating...' : 'Change setting to Private'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
