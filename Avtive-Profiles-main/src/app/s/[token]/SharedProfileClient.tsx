'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Ban,
  Clock,
  Lock,
  Contact,
  FileDown,
  FileText,
  Tag,
  ShieldCheck,
  Loader2,
  UserPlus,
  Share2,
  Check
} from 'lucide-react';
import type { ResolveShareLinkResult } from '@/lib/db/shareLinks';
import { AvtiveDigitalCard } from '@/components/card/AvtiveDigitalCard';
import { ProfileBackgroundLayer, resolveBackgroundMode } from '@/components/editor/BackgroundRenderer';
import { getThemeConfig } from '@/components/ui/themeStyles';
import { getBackgroundTheme } from '@/data/backgroundThemes';
import { downloadVCard } from '@/lib/vcard';
import { generateCardPdf } from '@/lib/cardPdfGenerator';
import { ExchangeContactModal } from '@/components/modals/ExchangeContactModal';
import { ResumeViewerModal } from '@/components/modals/ResumeViewerModal';

interface SharedProfileClientProps {
  result: ResolveShareLinkResult;
  isBotPreview?: boolean;
}

export function SharedProfileClient({ result, isBotPreview = false }: SharedProfileClientProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isBotPreview || result.outcome !== 'valid') {
    const config =
      result.outcome === 'revoked'
        ? {
            icon: Ban,
            badge: 'Access Revoked',
            title: 'This share link has been revoked',
            desc: 'The profile owner has disabled access to this link. Request a new link from them if you still need these details.',
            tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
          }
        : result.outcome === 'expired'
        ? {
            icon: Clock,
            badge: 'Link Expired',
            title: 'This share link is no longer active',
            desc: 'This link has either passed its expiration date or reached its maximum single-view limit.',
            tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
          }
        : result.outcome === 'rate_limited'
        ? {
            icon: ShieldAlert,
            badge: 'Rate Limited',
            title: 'Too many requests',
            desc: 'Please wait a moment before trying to open this shared profile again.',
            tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
          }
        : {
            icon: Lock,
            badge: 'Unavailable',
            title: 'Shared profile unavailable',
            desc: 'The share link is invalid or no longer exists.',
            tone: 'bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/15'
          };

    const Icon = config.icon;
    return (
      <main className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-white dark:bg-black text-zinc-950 dark:text-white font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-7 text-center space-y-5 shadow-xl">
          <div className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center ${config.tone}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.tone}`}>
              {config.badge}
            </span>
            <h1 className="text-xl font-bold text-zinc-950 dark:text-white">
              {config.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {config.desc}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-colors"
            >
              Go to Avtive
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { profile, shareMeta } = result;
  const activeThemeKey = profile.theme && profile.theme !== 'default' ? profile.theme : 'editorial';
  const themeConfig = getThemeConfig(activeThemeKey);
  const bgTheme = getBackgroundTheme(profile.activeBackgroundThemeId);
  const canDownloadResume = profile.sharingSettings?.resume === true;

  const handleCopyCurrentLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareMeta.title || `${profile.name} | Avtive`,
          url: window.location.href
        });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const url = typeof window !== 'undefined' ? window.location.href : undefined;
      await generateCardPdf(profile, false, url);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const bgMode = resolveBackgroundMode(profile);
  const hasCustomBg = bgMode !== 'default';

  return (
    <div
      data-theme={activeThemeKey}
      className={`min-h-[100dvh] w-full ${hasCustomBg ? 'bg-transparent' : themeConfig.pageBg} ${themeConfig.textPrimary} font-sans relative`}
    >
      <ProfileBackgroundLayer profile={profile} />
      {/* Top Visitor Action Strip */}
      <header className={`sticky top-0 z-30 backdrop-blur-md ${themeConfig.headerBg} border-b ${themeConfig.divider}`}>
        <div className="max-w-3xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/images/avtive-symbol.png" alt="Avtive" className="h-6 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold truncate max-w-[180px] sm:max-w-[260px]">
                  {shareMeta.title}
                </span>
                {shareMeta.eventLabel && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold">
                    <Tag className="w-2.5 h-2.5" />
                    {shareMeta.eventLabel}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span>
                  Permission-scoped pass ({shareMeta.selectedFieldsCount} items)
                  {shareMeta.expiryOption === '1_view' ? ' · Single-view link consumed' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.btnSecondary} text-[11px] font-bold flex items-center gap-1 cursor-pointer`}
            >
              <Contact className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Save Contact</span>
            </button>

            {canDownloadResume && (
              <button
                type="button"
                onClick={() => setIsResumeOpen(true)}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.btnSecondary} text-[11px] font-bold flex items-center gap-1 cursor-pointer`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CV</span>
              </button>
            )}

            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl ${themeConfig.btnPrimary} text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60`}
            >
              {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl ${themeConfig.btnPrimary} text-[11px] font-bold flex items-center gap-1 cursor-pointer`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCurrentLink}
              className={`min-h-[36px] w-9 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} flex items-center justify-center cursor-pointer`}
              title="Copy Share Link"
              aria-label="Copy Share Link"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Sanitized Card */}
      <main className="py-0 sm:py-6 px-0 sm:px-4">
        <div
          className={`w-full max-w-3xl mx-auto rounded-none sm:rounded-3xl border-0 sm:border ${themeConfig.cardBorder} ${themeConfig.cardBg} ${
            bgTheme ? 'backdrop-blur-md shadow-2xl' : 'shadow-none sm:shadow-xl'
          } overflow-hidden`}
        >
          <AvtiveDigitalCard
            profile={profile}
            canEdit={false}
            isEditing={false}
            isDark={false}
            onSaveContact={() => downloadVCard(profile)}
            onOpenShare={handleCopyCurrentLink}
            onOpenConnect={() => setIsConnectOpen(true)}
            onOpenQRModal={() => {}}
            onOpenResumeModal={() => {
              if (canDownloadResume) setIsResumeOpen(true);
            }}
            onSelectProject={() => {}}
          />
        </div>
      </main>

      {isConnectOpen && (
        <ExchangeContactModal
          isOpen={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          profile={profile}
        />
      )}

      {isResumeOpen && canDownloadResume && (
        <ResumeViewerModal
          isOpen={isResumeOpen}
          onClose={() => setIsResumeOpen(false)}
          profile={profile}
        />
      )}
    </div>
  );
}
