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
  Loader2,
  Share2,
  Copy,
  Check,
  Monitor,
  Smartphone
} from 'lucide-react';
import type { ResolveShareLinkResult } from '@/lib/db/shareLinks';
import type { ProjectItem } from '@/types/profile';
import { AvtiveDigitalCard } from '@/components/card/AvtiveDigitalCard';
import { PhonePreview } from '@/components/card/PhonePreview';
import { ProfileBackgroundLayer, resolveBackgroundMode } from '@/components/editor/BackgroundRenderer';
import { getThemeConfig } from '@/components/ui/themeStyles';
import { downloadVCard } from '@/lib/vcard';
import { generateCardPdf } from '@/lib/cardPdfGenerator';
import { ExchangeContactModal } from '@/components/modals/ExchangeContactModal';
import { ResumeViewerModal } from '@/components/modals/ResumeViewerModal';
import { ProjectDetailModal } from '@/components/modals/ProjectDetailModal';

interface SharedProfileClientProps {
  result: ResolveShareLinkResult;
  isBotPreview?: boolean;
}

export function SharedProfileClient({ result, isBotPreview = false }: SharedProfileClientProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState<string>('profile');

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
  const canDownloadResume = profile.sharingSettings?.resume === true;

  const handleCopyCurrentLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  const handleShareCurrentLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: shareMeta.title || `${profile.name} | Avtive`,
          url: window.location.href
        });
        return;
      }
      await handleCopyCurrentLink();
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

  const handleVisitorSectionSelect = (sectionKey: string) => {
    setActiveSection(sectionKey);
    if (typeof document === 'undefined') return;
    const target =
      document.getElementById(`section-${sectionKey}`) ||
      document.querySelector(`[data-section="${sectionKey}"]`);
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const bgMode = resolveBackgroundMode(profile);
  const hasCustomBg = bgMode !== 'default';

  return (
    <div
      data-theme={activeThemeKey}
      className={`min-h-[100dvh] w-full flex flex-col relative overflow-x-clip ${
        hasCustomBg ? 'bg-transparent' : themeConfig.pageBg
      } ${themeConfig.textPrimary} font-sans`}
    >
      <ProfileBackgroundLayer profile={profile} contained={true} />
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {/* Minimalist Visitor Action Strip */}
        <header className={`sticky top-0 z-30 backdrop-blur-md ${themeConfig.headerBg} border-b ${themeConfig.divider}`}>
        <div className="max-w-3xl mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/images/avtive-symbol.png" alt="Avtive" className="h-6 w-auto shrink-0" />
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold truncate max-w-[140px] sm:max-w-[260px]">
                {shareMeta.title}
              </span>
              {shareMeta.eventLabel && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold shrink-0">
                  <Tag className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[90px] sm:max-w-[140px]">{shareMeta.eventLabel}</span>
                </span>
              )}
              {shareMeta.expiryOption === '1_view' && (
                <span className="hidden sm:inline-flex text-[10px] text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
                  Single-view
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop / Mobile preview switch on desktop viewports only */}
            <div
              role="group"
              aria-label="Preview viewport mode"
              className={`hidden md:inline-flex items-center p-0.5 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg}`}
            >
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                aria-label="Desktop preview"
                aria-pressed={previewDevice === 'desktop'}
                title="Desktop preview"
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  previewDevice === 'desktop'
                    ? themeConfig.btnPrimary
                    : `${themeConfig.textMuted} hover:opacity-80`
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                aria-label="Mobile preview"
                aria-pressed={previewDevice === 'mobile'}
                title="Mobile preview"
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  previewDevice === 'mobile'
                    ? themeConfig.btnPrimary
                    : `${themeConfig.textMuted} hover:opacity-80`
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              className={`group relative h-9 w-9 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.btnSecondary} flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90`}
              title="Save Contact"
              aria-label="Save Contact"
            >
              <Contact className="w-4 h-4" />
              <span className="pointer-events-none hidden sm:group-hover:block sm:group-focus-visible:block absolute top-full mt-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium whitespace-nowrap shadow-md">
                Save Contact
              </span>
            </button>

            {canDownloadResume && (
              <button
                type="button"
                onClick={() => setIsResumeOpen(true)}
                className={`group relative h-9 w-9 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.btnSecondary} flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90`}
                title="View CV"
                aria-label="View CV"
              >
                <FileText className="w-4 h-4" />
                <span className="pointer-events-none hidden sm:group-hover:block sm:group-focus-visible:block absolute top-full mt-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium whitespace-nowrap shadow-md">
                  CV
                </span>
              </button>
            )}

            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className={`group relative h-9 w-9 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.btnSecondary} flex items-center justify-center cursor-pointer disabled:opacity-60 transition-opacity hover:opacity-90`}
              title="Download PDF"
              aria-label="Download PDF"
            >
              {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span className="pointer-events-none hidden sm:group-hover:block sm:group-focus-visible:block absolute top-full mt-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium whitespace-nowrap shadow-md">
                PDF
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyCurrentLink}
              className={`group relative h-9 w-9 rounded-xl border ${themeConfig.cardBorder} ${themeConfig.cardBg} flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90`}
              title="Copy Share Link"
              aria-label="Copy Share Link"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="pointer-events-none hidden sm:group-hover:block sm:group-focus-visible:block absolute top-full mt-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium whitespace-nowrap shadow-md">
                {copiedUrl ? 'Copied' : 'Copy'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShareCurrentLink}
              className={`group relative h-9 w-9 rounded-xl ${themeConfig.btnPrimary} flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90`}
              title="Share Profile"
              aria-label="Share Profile"
            >
              <Share2 className="w-4 h-4" />
              <span className="pointer-events-none hidden sm:group-hover:block sm:group-focus-visible:block absolute top-full mt-1.5 right-0 px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-medium whitespace-nowrap shadow-md">
                Share
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Sanitized Profile Preview */}
      <main className={`w-full flex-1 ${hasCustomBg ? 'py-3 sm:py-6 px-2.5 sm:px-4' : 'py-0 sm:py-6 px-0 sm:px-4'}`}>
        {/* Desktop Card View (Always used cleanly on mobile viewports < md) */}
        <div
          data-testid="shared-desktop-view"
          className={`${previewDevice === 'mobile' ? 'block md:hidden' : 'block'} w-full max-w-3xl mx-auto ${
            hasCustomBg ? 'rounded-2xl sm:rounded-3xl border shadow-xl' : 'rounded-none sm:rounded-3xl border-0 sm:border shadow-none sm:shadow-xl'
          } ${themeConfig.cardBorder} ${themeConfig.cardBg} overflow-hidden`}
        >
          <AvtiveDigitalCard
            profile={profile}
            canEdit={false}
            isEditing={false}
            isConnected={false}
            isDark={false}
            viewMode="standard"
            activeSection={activeSection}
            onSelectSection={handleVisitorSectionSelect}
            onSaveContact={() => downloadVCard(profile)}
            onOpenShare={handleShareCurrentLink}
            onOpenConnect={() => setIsConnectOpen(true)}
            onOpenQRModal={() => {}}
            onOpenResumeModal={() => {
              if (canDownloadResume) setIsResumeOpen(true);
            }}
            onSelectProject={(project) => setSelectedProject(project)}
          />
        </div>

        {/* Desktop Mobile-Preview Chassis (Shown on desktop >= md when toggled to Mobile) */}
        {previewDevice === 'mobile' && (
          <div data-testid="shared-mobile-preview" className="hidden md:flex justify-center py-2">
            <PhonePreview
              profile={profile}
              isDark={false}
              canEdit={false}
              isEditing={false}
              headerTitle="Mobile Preview"
              onSaveContact={() => downloadVCard(profile)}
              onOpenShare={handleShareCurrentLink}
              onOpenConnect={() => setIsConnectOpen(true)}
              onOpenQRModal={() => {}}
              onOpenResumeModal={() => {
                if (canDownloadResume) setIsResumeOpen(true);
              }}
              onSelectProject={(project) => setSelectedProject(project)}
              onSelectSection={handleVisitorSectionSelect}
            />
          </div>
        )}
      </main>
      </div>

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

      {selectedProject && (
        <ProjectDetailModal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          profile={profile}
        />
      )}
    </div>
  );
}
