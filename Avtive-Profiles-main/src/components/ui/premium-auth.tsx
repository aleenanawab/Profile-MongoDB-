'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: '', colorClass: 'bg-slate-200 dark:bg-zinc-800' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', colorClass: 'bg-rose-500' };
    case 2:
      return { score: 2, label: 'Fair', colorClass: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Good', colorClass: 'bg-sky-500' };
    case 4:
      return { score: 4, label: 'Strong', colorClass: 'bg-emerald-500' };
    default:
      return { score: 0, label: 'Too short', colorClass: 'bg-rose-400' };
  }
}

export function PasswordStrengthMeter({ password }: { password?: string }) {
  if (!password) return null;
  const { score, label, colorClass } = calculatePasswordStrength(password);

  return (
    <div className="space-y-1 pt-1.5" aria-live="polite">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 dark:text-zinc-400 font-medium">Password strength</span>
        <span className={cn('font-semibold', score <= 1 ? 'text-rose-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-sky-500' : 'text-emerald-500')}>
          {label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full rounded-full transition-all duration-300',
              step <= score ? colorClass : 'bg-slate-200 dark:bg-zinc-800'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export interface PremiumAuthCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  errorMessage?: string | null;
  successMessage?: string | null;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  onGoogleSignIn?: () => void;
  isGoogleLoading?: boolean;
  googleButtonText?: string;
  showDivider?: boolean;
  className?: string;
}

export function PremiumAuthCard({
  title,
  subtitle,
  badge = 'Avtive Identity',
  errorMessage,
  successMessage,
  children,
  footerContent,
  onGoogleSignIn,
  isGoogleLoading = false,
  googleButtonText = 'Continue with Google',
  showDivider = true,
  className = ''
}: PremiumAuthCardProps) {
  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className="relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0E121B]/95 backdrop-blur-xl shadow-xl overflow-hidden p-6 sm:p-8 transition-colors">
        {/* Subtle Ambient Header Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-slate-900/5 dark:bg-white/5 blur-2xl pointer-events-none rounded-full" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>{badge}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Global Inline Alerts */}
        {errorMessage && (
          <div 
            role="alert" 
            className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div 
            role="status" 
            className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{successMessage}</div>
          </div>
        )}

        {/* Google OAuth action */}
        {onGoogleSignIn && (
          <div className="space-y-4 mb-4">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full min-h-[44px] h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleButtonText}</span>
            </button>

            {showDivider && (
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
                <span className="bg-white dark:bg-[#0E121B] px-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider absolute">
                  or with email
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Form Content */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Optional Footer Link */}
        {footerContent && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 text-center text-xs text-slate-500 dark:text-zinc-400">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
