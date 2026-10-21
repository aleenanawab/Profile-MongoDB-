'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, User, Users, Shield, Sparkles, Building2 } from 'lucide-react';
import { ProfileType, ProfileTheme, normalizeProfileType } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

interface RoleCardData {
  id: ProfileType;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  features: string[];
}

const ROLE_OPTIONS: RoleCardData[] = [
  {
    id: 'individual',
    title: 'Individual',
    badge: 'Personal Profile',
    icon: User,
    description: 'Personal digital identity, showcase projects, skills, and private sharing.',
    features: [
      'Personal portfolio & project showcases',
      'Direct contact & social link hubs',
      'Granular privacy controls & custom NFC pass',
      'Multi-persona switching between identities'
    ]
  },
  {
    id: 'team',
    title: 'Company',
    badge: 'Company Profile',
    icon: Building2,
    description: 'Collaborative company presence, organization roster, services showcase, and business identity.',
    features: [
      'Company roster & collaborative showcases',
      'Products, services & organization credentials',
      'Unified company contact & inquiry channels',
      'Organization branding & employee passes'
    ]
  }
];

function RoleStepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = (searchParams.get('theme') as ProfileTheme) || 'editorial';
  const initialRole = normalizeProfileType(searchParams.get('role') || 'individual');

  // Shared state between Desktop and Mobile screens
  const [selectedRole, setSelectedRole] = useState<ProfileType>(initialRole);

  // Route protection: If user already has an active completed profile on server, redirect them
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.onboardingCompleted && data.hasProfile) {
          const targetSlug = data.profileSlug || data.profiles?.[0]?.slug || data.profile?.slug || data.profile?.id || data.user.id;
          if (targetSlug) {
            router.replace(`/profile/${targetSlug}`);
          }
        } else if (data.user?.role) {
          setSelectedRole(normalizeProfileType(data.user.role));
        }
      })
      .catch(() => {});
  }, [router]);

  const handleBack = () => {
    router.push('/');
  };

  const handleNext = async () => {
    try {
      localStorage.setItem('avtive_selected_role', selectedRole);
      await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole })
      });
    } catch {}
    router.push(`/onboarding/theme?role=${selectedRole}&theme=${theme}`);
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
            <span>Step 1 of 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Select Your Profile Type
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose whether this workspace represents an individual identity or an organization hub.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>Next: Choose Theme</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2 Widescreen Role Studio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRole === role.id;
          const Icon = role.icon;

          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400/80 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#121B32]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 font-mono text-[10px] font-extrabold tracking-wider">
                  SELECTED
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/30' : 'bg-slate-100 dark:bg-white/5 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-white/10'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide block">
                      {role.badge}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{role.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  {role.description}
                </p>

                {/* Features list */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                  {role.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Radio */}
              <div className="pt-6 mt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isSelected ? 'Currently Selected' : 'Click to select this type'}
                </span>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 font-bold' : 'border-slate-300 dark:border-white/20'
                }`}>
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
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
            <span className="text-xs font-mono font-medium tracking-wider text-slate-500 dark:text-slate-400">
              1/3
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Select Profile Type
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Select the type that matches your profile purpose.
            </p>
          </div>
        </div>

        {/* Role Cards List matching Figma Screen 4 */}
        <div className="space-y-3 mb-3 w-full max-w-full box-border">
          {ROLE_OPTIONS.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full max-w-full box-border p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-cyan-50/50 dark:bg-[#151D30] border-cyan-500 dark:border-cyan-400/80 shadow-xs ring-1 ring-cyan-500/40'
                    : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {role.title}
                      </h3>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                        {role.badge}
                      </span>
                    </div>
                  </div>

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

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  {role.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 w-full max-w-full box-border">
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Continue to Theme</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="1. Select Profile Type"
      workflowSubtitle="Onboarding Step 1 of 3"
      currentUrlPath={`/onboarding/role?theme=${theme}&role=${selectedRole}`}
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}

export default function OnboardingRolePage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm">Loading role options...</div>}>
      <RoleStepContent />
    </Suspense>
  );
}
