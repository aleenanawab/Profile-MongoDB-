'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { ProfileTheme } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';
import { usePortfolioTheme, PortfolioTheme } from '@/context/ThemeContext';

interface ThemeCardData {
  id: ProfileTheme;
  title: string;
  previewBg: string;
  previewBorder: string;
  accentColor: string;
  cardBg: string;
}

const THEME_OPTIONS: ThemeCardData[] = [
  {
    id: 'editorial',
    title: 'Editorial Monochrome',
    previewBg: 'bg-white',
    previewBorder: 'border-zinc-300',
    accentColor: '#09090B',
    cardBg: 'bg-white text-zinc-950',
  },
  {
    id: 'cyber',
    title: 'Developer Terminal',
    previewBg: 'bg-[#09090B]',
    previewBorder: 'border-emerald-500/40',
    accentColor: '#10B981',
    cardBg: 'bg-[#121215] text-white',
  },
  {
    id: 'luxe',
    title: 'Luxe Velvet',
    previewBg: 'bg-[#0D0509]',
    previewBorder: 'border-rose-500/40',
    accentColor: '#FB7185',
    cardBg: 'bg-[#180D15] text-white',
  }
];

function ThemeStepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTheme = (searchParams.get('theme') as ProfileTheme) || 'editorial';
  const role = searchParams.get('role') || 'individual';
  const { setTheme: setContextTheme } = usePortfolioTheme();

  const [selectedTheme, setSelectedTheme] = useState<ProfileTheme>(initialTheme);

  // If user is already authenticated with a completed profile, redirect directly to profile view
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.onboardingCompleted && data.hasProfile) {
          const targetSlug = data.profileSlug || data.profiles?.[0]?.slug || data.profile?.slug || data.profile?.id || data.user.id;
          if (targetSlug) {
            router.replace(`/profile/${targetSlug}`);
            return;
          }
        }
        if (!role && !data.user?.role) {
          router.replace('/onboarding/role');
          return;
        }
        if (data.user?.preferredTheme) {
          setSelectedTheme(data.user.preferredTheme);
        }
      })
      .catch(() => {});
  }, [router, role]);

  const handleSelectTheme = (themeId: ProfileTheme) => {
    setSelectedTheme(themeId);
    setContextTheme(themeId as PortfolioTheme);
  };

  const handleFinish = async (themeToSave: ProfileTheme) => {
    setContextTheme(themeToSave as PortfolioTheme);
    try {
      await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, theme: themeToSave })
      });
    } catch (err) {
      console.error('Theme onboarding save error:', err);
    }

    router.push(`/edit-profile?role=${encodeURIComponent(role)}&theme=${encodeURIComponent(themeToSave)}`);
  };

  const handleNext = () => handleFinish(selectedTheme);
  const handleSkip = () => handleFinish('editorial');
  const handleBack = () => router.push(`/onboarding/role?role=${role}&theme=${selectedTheme}`);

  // Desktop View
  const desktopView = (
    <div className="w-full max-w-4xl mx-auto my-auto py-8 px-4 sm:px-6 space-y-8 text-left box-border">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Choose Your Theme
        </h1>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {THEME_OPTIONS.map((item) => {
          const isSelected = selectedTheme === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleSelectTheme(item.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-black dark:border-white shadow-md ring-1 ring-black/20 dark:ring-white/25'
                  : 'bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
              }`}
            >
              <div>
                {/* Visual Thumbnail */}
                <div className={`w-full h-28 rounded-xl p-3 mb-4 flex flex-col justify-between border ${item.previewBg} ${item.previewBorder}`}>
                  <div className="flex items-center justify-end">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.accentColor }} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-16 h-2 rounded bg-current opacity-40" />
                    <div className="w-28 h-3 rounded bg-current opacity-70" />
                  </div>
                </div>

                <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                  {item.title}
                </h2>
              </div>

              <div className="pt-4 mt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black font-bold' : 'border-zinc-300 dark:border-zinc-700'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Mobile View
  const mobileView = (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex-1 flex flex-col justify-between text-left">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-[44px] px-3 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center"
          >
            Skip
          </button>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Choose Your Theme
        </h1>

        <div className="space-y-3">
          {THEME_OPTIONS.map((item) => {
            const isSelected = selectedTheme === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectTheme(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-black dark:border-white shadow-xs ring-1 ring-black/20 dark:ring-white/25'
                    : 'bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail Preview */}
                  <div 
                    className={`w-12 h-10 rounded-lg p-1.5 flex flex-col justify-between shrink-0 border ${
                      item.id === 'editorial'
                        ? 'bg-white border-zinc-200 text-zinc-950'
                        : item.id === 'cyber'
                        ? 'bg-[#09090B] border-emerald-500/40 text-emerald-400'
                        : 'bg-[#180D15] border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="w-full h-1.5 rounded-xs bg-current opacity-30" />
                    <div className="w-6 h-1 rounded-2xs bg-current opacity-50" />
                  </div>

                  <h2 className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                    {item.title}
                  </h2>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black font-bold'
                      : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <span>Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="Choose Your Theme"
      workflowSubtitle="Select Design Style"
      currentUrlPath={`/onboarding/theme?theme=${selectedTheme}`}
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}

export default function OnboardingThemePage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm">Loading themes...</div>}>
      <ThemeStepContent />
    </Suspense>
  );
}
