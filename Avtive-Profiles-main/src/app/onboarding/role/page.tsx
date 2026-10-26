'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowRight, User, Building2 } from 'lucide-react';
import { ProfileType, ProfileTheme, normalizeProfileType } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

const ROLE_OPTIONS: { id: ProfileType; title: string; icon: React.ElementType }[] = [
  {
    id: 'individual',
    title: 'Individual',
    icon: User,
  },
  {
    id: 'team',
    title: 'Company',
    icon: Building2,
  }
];

function RoleStepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = (searchParams.get('theme') as ProfileTheme) || 'editorial';
  const initialRole = normalizeProfileType(searchParams.get('role') || 'individual');

  const [selectedRole, setSelectedRole] = useState<ProfileType>(initialRole);

  // Returning users skip onboarding
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

  // Desktop View
  const desktopView = (
    <div className="w-full max-w-2xl mx-auto my-auto py-8 px-4 sm:px-6 space-y-8 text-left box-border">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Choose Your Role
        </h1>
        <button
          type="button"
          onClick={handleNext}
          className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRole === role.id;
          const Icon = role.icon;

          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between items-start gap-4 relative ${
                isSelected
                  ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400 shadow-md ring-2 ring-cyan-500/30'
                  : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#121B32]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isSelected ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-white/10'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 font-bold' : 'border-slate-300 dark:border-white/20'
                }`}>
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {role.title}
              </h2>
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
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Choose Your Role
        </h1>

        <div className="space-y-3">
          {ROLE_OPTIONS.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-50/50 dark:bg-[#151D30] border-cyan-500 dark:border-cyan-400 shadow-xs ring-2 ring-cyan-500/30'
                    : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-cyan-500 text-white dark:text-slate-950' : 'bg-slate-100 dark:bg-white/10 text-cyan-600 dark:text-cyan-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {role.title}
                  </h2>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                    : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={handleNext}
          className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="Choose Your Role"
      workflowSubtitle="Select Individual or Company"
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
