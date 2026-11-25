'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Lock, EyeOff, ArrowRight, Settings2 } from 'lucide-react';
import { PrivacyTier } from '@/types/profile';

export interface SafetyCheckTarget {
  fieldKey: string;
  label: string;
  tier: 'private' | 'never_share';
  maskedPreview?: string;
  isSystemLocked?: boolean;
}

interface SafetyCheckDialogProps {
  target: SafetyCheckTarget | null;
  onClose: () => void;
  onConfirmPrivateInclude: (fieldKey: string) => void;
  onChangeFieldPrivacy?: (fieldKey: string, nextTier: PrivacyTier) => Promise<void> | void;
}

export function SafetyCheckDialog({
  target,
  onClose,
  onConfirmPrivateInclude,
  onChangeFieldPrivacy
}: SafetyCheckDialogProps) {
  const [isUpdatingTier, setIsUpdatingTier] = React.useState(false);

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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-check-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121622] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-5 text-center"
      >
        <div
          className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border ${
            isNeverShare
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isNeverShare ? <Lock className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-700 dark:text-amber-400">
            Safety Check
          </div>
          <h3
            id="safety-check-title"
            className="text-lg font-bold text-slate-900 dark:text-white leading-snug"
          >
            {isNeverShare
              ? `${target.label} is set to Never Share`
              : `${target.label} is marked Private`}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isNeverShare
              ? 'Sensitive or restricted fields remain permanently excluded from all presets, share links, QR codes, and exports.'
              : 'Private fields are excluded by default. Confirm explicitly if you want to allow this field in the current share link.'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-left flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200">
            {isNeverShare ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {target.label}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {target.maskedPreview || '•••• Protected'}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
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
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Include in this share link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isNeverShare && target.isSystemLocked && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pt-1">
              Protected by platform Never Share policy — cannot be enabled for links or exports.
            </p>
          )}

          {isNeverShare && !target.isSystemLocked && onChangeFieldPrivacy && (
            <button
              type="button"
              disabled={isUpdatingTier}
              onClick={handleSetPrivate}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline pt-1 cursor-pointer disabled:opacity-50"
            >
              <Settings2 className="w-3 h-3" />
              <span>{isUpdatingTier ? 'Updating...' : 'Change setting to Private'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
