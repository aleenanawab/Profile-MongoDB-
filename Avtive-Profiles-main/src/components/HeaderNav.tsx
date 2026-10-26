'use client';

import React, { useState } from 'react';
import { 
  Share2, 
  Sun, 
  Moon, 
  Smartphone, 
  Tv, 
  Edit3, 
  CreditCard, 
  Building2, 
  Users, 
  ChevronDown,
  LogIn, 
  LogOut,
  LayoutGrid,
  Save,
  Check,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { ProfileData, ProfileType, UserRole, UserSession } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';

interface HeaderNavProps {
  currentProfile: ProfileData;
  profileType?: ProfileType;
  onSelectProfileType?: (type: ProfileType, origin?: 'company' | 'my_card' | 'direct' | 'team') => void;
  onOpenEdit?: () => void;
  onOpenShare?: () => void;
  canEdit?: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onSaveEdits?: () => void;
  isSaving?: boolean;
  userRole?: UserRole;
  onChangeUserRole?: (role: UserRole) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  viewMode?: 'desktop' | 'mobile';
  onToggleViewMode?: (mode: 'desktop' | 'mobile') => void;
  onOpenMyCard?: () => void;
  session?: UserSession | null;
  onLogout?: () => void;
  theme?: ThemeConfig;
  onToggleSections?: () => void;
  onSectionsMouseEnter?: () => void;
  onSectionsMouseLeave?: () => void;
}

export function HeaderNav({
  currentProfile,
  profileType = 'individual',
  onSelectProfileType,
  onOpenEdit,
  onOpenShare,
  canEdit = false,
  isEditing = false,
  onCancelEdit,
  onSaveEdits,
  isSaving = false,
  isDark = false,
  onToggleTheme,
  onOpenMyCard,
  session,
  onLogout,
  theme = getThemeConfig(currentProfile.theme || 'editorial'),
  onToggleSections,
  onSectionsMouseEnter,
  onSectionsMouseLeave
}: HeaderNavProps) {
  const hasTeamOrCompany = Boolean(
    currentProfile.companyId || 
    currentProfile.companyInfo || 
    (currentProfile.teamMembers && currentProfile.teamMembers.length > 0) || 
    profileType === 'team'
  );

  return (
    <header className={`sticky top-0 z-40 w-full pt-[max(0rem,env(safe-area-inset-top))] backdrop-blur-md ${theme.headerBg} border-b ${theme.divider} transition-colors shadow-2xs`}>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 min-w-0">
        {/* Left: Menu Toggle & Avtive Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleSections && (
            <button
              type="button"
              onClick={onToggleSections}
              onMouseEnter={onSectionsMouseEnter}
              onMouseLeave={onSectionsMouseLeave}
              className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl ${theme.cardBg} hover:opacity-90 ${theme.textPrimary} border ${theme.cardBorder} transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 text-xs font-semibold`}
              title="Profile Sections Menu"
              aria-label="Sections Menu"
            >
              <LayoutGrid className={`w-4 h-4 ${theme.accentText}`} />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}

          <Link 
            href="/"
            className="flex items-center gap-2 group cursor-pointer shrink-0 min-h-[44px]"
            title="Avtive Digital Identity"
          >
            <div className="h-8 flex items-center">
              <img 
                src="/images/avtive-symbol.png" 
                alt="Avtive Logo" 
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-sm ${theme.accentText} tracking-tight`}>
                  Avtive
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} font-bold font-mono leading-none`}>
                  Official
                </span>
              </div>
              <p className={`text-[10px] ${theme.textMuted} font-medium leading-tight hidden md:block`}>
                Digital Identity Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Options (Only shown when not editing and profile has both Individual and Team profiles) */}
        {hasTeamOrCompany && onSelectProfileType && !isEditing && (
          <div className={`hidden sm:flex items-center p-0.5 sm:p-1 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-xs shrink-0`}>
            {/* 1. Individual */}
            <button
              type="button"
              onClick={onOpenMyCard}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-xl font-bold transition-all cursor-pointer ${
                profileType === 'individual'
                  ? `${theme.btnPrimary} shadow-xs`
                  : `${theme.textMuted} hover:${theme.textPrimary}`
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>Individual</span>
            </button>
            
            {/* 2. Team */}
            <button
              type="button"
              onClick={() => onSelectProfileType('team', 'team')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-xl font-bold transition-all cursor-pointer ${
                profileType === 'team'
                  ? `${theme.btnPrimary} shadow-xs`
                  : `${theme.textMuted} hover:${theme.textPrimary}`
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Team</span>
            </button>
          </div>
        )}

        {/* Right Controls: Edit/Save/Cancel, Theme Toggle, Share, and Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          {/* Edit Profile Button (Visible only to authenticated profile owner when not editing) */}
          {canEdit && !isEditing && onOpenEdit && (
            <button
              type="button"
              onClick={onOpenEdit}
              className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl ${theme.cardBg} hover:opacity-90 ${theme.textPrimary} border ${theme.cardBorder} transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 text-xs font-semibold`}
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <Edit3 className={`w-4 h-4 ${theme.accentText}`} />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
          )}

          {/* Edit Mode Actions: Cancel and Save (Visible when isEditing) */}
          {isEditing && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl ${theme.cardBg} hover:opacity-90 ${theme.textSecondary} border ${theme.cardBorder} transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50`}
                  title="Cancel and discard changes"
                  aria-label="Cancel Changes"
                >
                  <X className="w-4 h-4 text-rose-500" />
                </button>
              )}
              {onSaveEdits && (
                <button
                  type="button"
                  onClick={onSaveEdits}
                  disabled={isSaving}
                  className={`min-h-[44px] px-3.5 rounded-xl ${theme.btnPrimary} text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50`}
                  title="Finish editing and view profile"
                  aria-label="Done Editing"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Done'}</span>
                </button>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl ${theme.cardBg} hover:opacity-90 ${theme.textPrimary} border ${theme.cardBorder} transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center justify-center active:scale-95`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className={`w-4 h-4 ${theme.accentText}`} />
              )}
            </button>
          )}

          {/* Share Button (When not editing) */}
          {onOpenShare && !isEditing && (
            <button
              type="button"
              onClick={onOpenShare}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl ${theme.btnPrimary} font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center justify-center`}
              title="Share Profile"
              aria-label="Share Profile"
            >
              <Share2 className="w-4 h-4 shrink-0" />
            </button>
          )}

          {/* Logout Button */}
          {session && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center justify-center"
              title="Sign Out"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
