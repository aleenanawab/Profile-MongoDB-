'use client';

import React from 'react';
import { Wifi, Battery, Signal, Smartphone } from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { AvtiveDigitalCard } from '@/components/card/AvtiveDigitalCard';

interface PhonePreviewProps {
  profile: ProfileData;
  isDark?: boolean;
  canEdit?: boolean;
  isEditing?: boolean;
  onOpenEdit?: () => void;
  onOpenShare?: () => void;
  onOpenConnect?: () => void;
  onOpenQRModal?: () => void;
  onOpenResumeModal?: () => void;
  onSaveContact?: () => void;
  onSaveEdits?: (data: ProfileData) => Promise<void>;
  onSelectTeamMember?: (member: any) => void;
  onViewCompany?: () => void;
  onSelectProject?: (project: any) => void;
  hideHeaderLabel?: boolean;
  headerTitle?: string;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function PhonePreview({ 
  profile, 
  isDark = false,
  canEdit = false,
  isEditing = false,
  onOpenEdit,
  onOpenShare,
  onOpenConnect,
  onOpenQRModal,
  onOpenResumeModal,
  onSaveContact,
  onSaveEdits,
  onSelectTeamMember,
  onViewCompany,
  onSelectProject,
  hideHeaderLabel = false,
  headerTitle = 'Live Mobile Preview',
  onSelectSection
}: PhonePreviewProps) {
  return (
    <div className="w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[375px] flex flex-col items-center select-none box-border">
      {/* Phone Header Label */}
      {!hideHeaderLabel && (
        <div 
          className="w-full flex items-center justify-between pb-2 px-3 text-xs font-bold text-slate-500 dark:text-zinc-400 transition-all"
        >
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] truncate font-mono">
            <Smartphone className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
            <span className="truncate">{headerTitle}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Standard 375×667 px
          </span>
        </div>
      )}

      {/* Realistic Standard Smartphone Chassis (Responsive viewport-adaptive) */}
      <div 
        className="relative w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[375px] h-[min(667px,calc(100dvh-2.5rem))] rounded-[32px] sm:rounded-[40px] p-2 sm:p-2.5 bg-gradient-to-b from-[#222736] via-[#141824] to-[#0A0D15] shadow-2xl shadow-black/80 ring-1 ring-white/15 border border-white/10 flex flex-col transition-all overflow-hidden shrink-0 box-border"
      >
        
        {/* Internal Screen Frame */}
        <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-white dark:bg-[#0E1528] flex flex-col border border-black/40 select-text">
          
          {/* iOS Status Bar */}
          <div className="relative z-30 flex items-center justify-between px-5 pt-2 pb-1 text-[11px] font-semibold text-slate-800 dark:text-white select-none bg-transparent shrink-0">
            <span className="tabular-nums font-mono text-[11px]">9:41</span>

            {/* Dynamic Notch */}
            <div className="w-20 h-4 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-sm shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1c1f28] ring-1 ring-white/10" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Scrollable Live Profile Screen */}
          <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden scrollbar-none overscroll-contain">
            <AvtiveDigitalCard
              profile={profile}
              canEdit={canEdit}
              isEditing={isEditing}
              isConnected={false}
              onOpenEdit={onOpenEdit || (() => {})}
              onCancelEdit={() => {}}
              onSaveEdits={onSaveEdits}
              onSaveContact={onSaveContact || (() => {})}
              onOpenShare={onOpenShare || (() => {})}
              onOpenConnect={onOpenConnect || (() => {})}
              onOpenQRModal={onOpenQRModal || (() => {})}
              onOpenResumeModal={onOpenResumeModal || (() => {})}
              onSelectProject={onSelectProject || (() => {})}
              onSelectTeamMember={onSelectTeamMember || (() => {})}
              onViewCompany={onViewCompany || (() => {})}
              isDark={isDark}
              viewMode="standard"
              onSelectSection={onSelectSection}
            />
          </div>

          {/* Bottom Home Indicator */}
          <div className="relative z-30 w-full py-1.5 flex justify-center bg-transparent pointer-events-none shrink-0">
            <div className="w-28 h-1 bg-black/40 dark:bg-white/40 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
}
