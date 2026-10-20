'use client';

import React from 'react';
import { Phone, MessageSquare, UserPlus } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface StickyBottomBarProps {
  profile: ProfileData;
  onSaveContact: () => void;
}

export function StickyBottomBar({ profile, onSaveContact }: StickyBottomBarProps) {
  const theme = getThemeConfig(profile.theme || 'elegant');

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none md:hidden">
      <div className={`pointer-events-auto flex items-center justify-between gap-2 p-2 rounded-full ${theme.cardBg}/95 border ${theme.cardBorder} shadow-2xl backdrop-blur-md max-w-sm w-full`}>
        {profile.phone ? (
          <a
            href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-xs font-semibold ${theme.textPrimary} hover:opacity-80 transition-colors`}
          >
            <Phone className={`w-3.5 h-3.5 ${theme.accentText}`} />
            <span>Call</span>
          </a>
        ) : null}

        {profile.whatsapp ? (
          <a
            href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(profile.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-xs font-semibold ${theme.textPrimary} hover:opacity-80 transition-colors`}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${theme.accentText}`} />
            <span>WhatsApp</span>
          </a>
        ) : null}

        <button
          onClick={onSaveContact}
          className={`flex-[1.3] flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-bold ${theme.btnPrimary} shadow-sm transition-transform active:scale-95`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Save Contact</span>
        </button>
      </div>
    </div>
  );
}
