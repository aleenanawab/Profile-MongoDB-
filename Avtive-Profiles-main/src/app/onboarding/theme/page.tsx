'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowRight, Sparkles, Terminal, Gem, ArrowLeft } from 'lucide-react';
import { ProfileTheme } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';
import { usePortfolioTheme, PortfolioTheme } from '@/context/ThemeContext';

interface ThemeCardData {
  id: ProfileTheme;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  previewBg: string;
  previewBorder: string;
  accentColor: string;
  cardBg: string;
  description: string;
  fontTag: string;
}

const THEME_OPTIONS: ThemeCardData[] = [
  {
    id: 'editorial',
    title: 'Editorial Minimal',
    subtitle: 'Clean, Classy, Professional',
    icon: Sparkles,
    previewBg: 'bg-[#FAFAF9]',
    previewBorder: 'border-stone-300',
    accentColor: '#C2410C',
    cardBg: 'bg-white text-stone-900',
    description: 'High-contrast typography, crisp borders, and timeless serif accents tailored for creatives, consultants, and leaders.',
    fontTag: 'Serif & Clean Sans'
  },
  {
    id: 'cyber',
    title: 'Developer Terminal',
    subtitle: 'Dark, Techy, Modern',
    icon: Terminal,
    previewBg: 'bg-[#09090B]',
    previewBorder: 'border-emerald-500/40',
    accentColor: '#10B981',
    cardBg: 'bg-[#121215] text-white',
    description: 'Monospace code highlights, neon emerald badges, and dark terminal aesthetic built for software engineers and makers.',
    fontTag: 'JetBrains Mono'
  },
  {
    id: 'luxe',
    title: 'Luxe Velvet',
    subtitle: 'Rich, Bold, Premium',
    icon: Gem,
    previewBg: 'bg-[#0D0509]',
    previewBorder: 'border-rose-500/40',
    accentColor: '#FB7185',
    cardBg: 'bg-[#180D15] text-white',
    description: 'Deep royal plum tones, glowing velvet accents, and premium luxury finishes for executive branding.',
    fontTag: 'Display Velvet'
  }
];

function ThemeStepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTheme = (searchParams.get('theme') as ProfileTheme) || 'editorial';
  const role = searchParams.get('role') || 'individual';
  const { setTheme: setContextTheme } = usePortfolioTheme();

  // Shared theme state between Desktop and Mobile screens
  const [selectedTheme, setSelectedTheme] = useState<ProfileTheme>(initialTheme);

  // If user is already authenticated with a completed profile, redirect immediately so theme is not asked again
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.onboardingCompleted) {
          const targetSlug = data.profileSlug || data.profiles?.[0]?.slug || data.profile?.slug || data.profile?.id || data.user.id;
          if (targetSlug) {
            router.replace(`/profile/${targetSlug}`);
          } else {
            router.replace('/dashboard');
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSelectTheme = (themeId: ProfileTheme) => {
    setSelectedTheme(themeId);
    setContextTheme(themeId as PortfolioTheme);
  };

  const handleNext = () => {
    setContextTheme(selectedTheme as PortfolioTheme);
    window.location.href = `/edit-profile?role=${encodeURIComponent(role)}&theme=${encodeURIComponent(selectedTheme)}&edit=true`;
  };

  const handleSkip = () => {
    setContextTheme('editorial');
    window.location.href = `/edit-profile?role=${encodeURIComponent(role)}&theme=editorial&edit=true`;
  };

  const handleBack = () => {
    router.push(`/onboarding/role?role=${role}&theme=${selectedTheme}`);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full max-w-5xl mx-auto my-auto py-6 px-4 sm:px-6 space-y-6 text-left box-border">
      
      {/* Desktop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <span>Onboarding Flow</span>
            <span>&middot;</span>
            <span>Step 2 of 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Choose Your Design Theme
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pick a foundation that matches your vibe. Your cards, typography, and badges will adapt seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>Finish & View Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Widescreen Theme Studio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {THEME_OPTIONS.map((item) => {
          const isSelected = selectedTheme === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => handleSelectTheme(item.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#121B32]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 font-mono text-[10px] font-extrabold tracking-wider">
                  ACTIVE
                </div>
              )}

              <div>
                {/* Visual Canvas Demo Box */}
                <div className={`w-full h-28 rounded-xl p-3 mb-4 flex flex-col justify-between border ${item.previewBg} ${item.previewBorder}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-white">
                      {item.fontTag}
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.accentColor }} />
                  </div>
                  <div className="space-y-1">
                    <div className="w-16 h-2 rounded bg-current opacity-40" />
                    <div className="w-28 h-3 rounded bg-current opacity-70" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-cyan-600 dark:text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom selection bar */}
              <div className="pt-4 mt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">Accent: {item.accentColor}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 font-bold' : 'border-slate-300 dark:border-white/20'
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

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="w-full max-w-full box-border px-4 py-2 flex-1 flex flex-col justify-between text-left overflow-x-hidden">
      
      <div className="w-full max-w-full box-border">
        {/* Screen Header: Back Arrow, Skip button, Step Indicator, Title & Subtitle */}
        <div className="space-y-1.5 mb-3 w-full box-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 w-full box-border">
            <button
              type="button"
              onClick={handleBack}
              className="p-1 -ml-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Skip
              </button>
              <span className="text-xs font-mono font-medium tracking-wider text-slate-500 dark:text-slate-400">
                2/3
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Choose Theme
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pick a style that matches your vibe. You can change it anytime.
            </p>
          </div>
        </div>

        {/* Theme Cards List */}
        <div className="space-y-2.5 mb-3 w-full max-w-full box-border">
          {THEME_OPTIONS.map((item) => {
            const isSelected = selectedTheme === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectTheme(item.id)}
                className={`w-full max-w-full box-border p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-50/50 dark:bg-[#151D30] border-cyan-500 dark:border-cyan-400/80 shadow-xs ring-1 ring-cyan-500/40'
                    : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Visual Thumbnail Preview */}
                  <div 
                    className={`w-12 h-10 rounded-xl p-1.5 flex flex-col justify-between shrink-0 border ${
                      item.id === 'editorial'
                        ? 'bg-[#FAFAF9] border-stone-200 text-stone-900'
                        : item.id === 'cyber'
                        ? 'bg-[#09090B] border-emerald-500/40 text-emerald-400'
                        : 'bg-[#180D15] border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="w-full h-1.5 rounded-xs bg-current opacity-30" />
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-current opacity-60 shrink-0" />
                      <div className="w-4 h-1 rounded-2xs bg-current opacity-40" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Radio Indicator */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 font-bold'
                      : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: Skip and Next */}
      <div className="pt-2 flex items-center gap-2 w-full max-w-full box-border">
        <button
          type="button"
          onClick={handleSkip}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="2. Choose Theme"
      workflowSubtitle="Onboarding Step 2 of 3"
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
