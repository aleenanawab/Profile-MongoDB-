'use client';

import React from 'react';
import { Phone, MessageSquare, Mail, UserPlus, Share2, Sparkles, Globe } from 'lucide-react';
import { ProfileData } from '../types/profile';

interface ActionButtonsProps {
  profile: ProfileData;
  onSaveContact: () => void;
  onOpenShare: () => void;
  onOpenConnect: () => void;
}

export function ActionButtons({
  profile,
  onSaveContact,
  onOpenShare,
  onOpenConnect
}: ActionButtonsProps) {
  return (
    <section className="px-6 sm:px-8 py-4 bg-white dark:bg-[#171F19] border-b border-[#E5E8E5] dark:border-white/10 transition-colors">
      {/* Primary Actions Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* 1. Save Contact */}
        <button
          onClick={onSaveContact}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-[#7EC384] hover:bg-[#6db673] text-[#0E2313] font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Save Contact</span>
        </button>

        {/* 2. Connect / Lead Exchange */}
        <button
          onClick={onOpenConnect}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-[#F7F8F7] hover:bg-[#EFF2EF] dark:bg-[#232E27] dark:hover:bg-[#2A382F] text-[#171F19] dark:text-[#F2F6F3] font-bold text-xs border border-[#E5E8E5] dark:border-white/10 transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 text-[#7EC384]" />
          <span>Connect</span>
        </button>

        {/* 3. Share */}
        <button
          onClick={onOpenShare}
          className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-[#F7F8F7] hover:bg-[#EFF2EF] dark:bg-[#232E27] dark:hover:bg-[#2A382F] text-[#171F19] dark:text-[#F2F6F3] font-bold text-xs border border-[#E5E8E5] dark:border-white/10 transition-all active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4 text-[#58665B] dark:text-[#A0ADA4]" />
          <span>Share</span>
        </button>
      </div>

      {/* Direct Contact Icons Row */}
      <div className="grid grid-cols-4 gap-2 mt-2.5">
        {profile.phone && (
          <a
            href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-[#FAFBFA] hover:bg-[#EFF2EF] dark:bg-[#1D2620] dark:hover:bg-[#232E27] border border-[#E5E8E5] dark:border-white/10 transition-colors group shadow-2xs"
          >
            <Phone className="w-4 h-4 text-[#7EC384] mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-[#171F19] dark:text-[#F2F6F3]">Call</span>
          </a>
        )}

        {profile.whatsapp && (
          <a
            href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(profile.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-[#FAFBFA] hover:bg-[#EFF2EF] dark:bg-[#1D2620] dark:hover:bg-[#232E27] border border-[#E5E8E5] dark:border-white/10 transition-colors group shadow-2xs"
          >
            <MessageSquare className="w-4 h-4 text-[#7EC384] mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-[#171F19] dark:text-[#F2F6F3]">WhatsApp</span>
          </a>
        )}

        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-[#FAFBFA] hover:bg-[#EFF2EF] dark:bg-[#1D2620] dark:hover:bg-[#232E27] border border-[#E5E8E5] dark:border-white/10 transition-colors group shadow-2xs"
          >
            <Mail className="w-4 h-4 text-[#58665B] dark:text-[#A0ADA4] mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-[#171F19] dark:text-[#F2F6F3]">Email</span>
          </a>
        )}

        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl bg-[#FAFBFA] hover:bg-[#EFF2EF] dark:bg-[#1D2620] dark:hover:bg-[#232E27] border border-[#E5E8E5] dark:border-white/10 transition-colors group shadow-2xs"
          >
            <Globe className="w-4 h-4 text-[#58665B] dark:text-[#A0ADA4] mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold text-[#171F19] dark:text-[#F2F6F3]">Website</span>
          </a>
        )}
      </div>
    </section>
  );
}
