'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Download, Share2, Contact } from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { SharePresetKey } from '@/types/sharing';
import { UnifiedShareDrawer } from '@/components/sharing/UnifiedShareDrawer';
import { downloadVCard } from '@/lib/vcard';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  userProfiles?: ProfileData[];
  selectedProfileId?: string;
  onSelectProfileId?: (profileId: string) => void;
  draftSelectionsByProfile?: Record<string, string[]>;
  onUpdateDraftSelection?: (profileId: string, fields: string[]) => void;
  draftPresetByProfile?: Record<string, SharePresetKey | 'custom'>;
  onUpdateDraftPreset?: (profileId: string, preset: SharePresetKey | 'custom') => void;
  onCopySuccess?: () => void;
  isOwner?: boolean;
  onUpdateProfile?: (updatedProfile: ProfileData) => void;
  isDark?: boolean;
}

/**
 * Compact read-only share dialog when a public visitor clicks Share on a public profile.
 * Never exposes owner controls, templates, contacts, or hidden data.
 */
function VisitorPublicShareModal({
  isOpen,
  onClose,
  profile,
  onCopySuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onCopySuccess?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const identifier = profile.slug || profile.id;
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${identifier}`
      : `https://www.avtive.app/profile/${identifier}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(publicUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
      .then(setQrUrl)
      .catch(() => {});
  }, [isOpen, publicUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${profile.name} | Avtive`, url: publicUrl });
        return;
      } catch {}
    }
    await handleCopy();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#11182B] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-center"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-cyan-500" />
            <span>Share {profile.name}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 inline-block">
          {qrUrl ? (
            <img src={qrUrl} alt="Public Profile QR" className="w-40 h-40 rounded-lg" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
          )}
        </div>

        <div className="p-2 pl-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">
            {publicUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleNativeShare}
            className="min-h-[42px] py-2 px-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={() => downloadVCard(profile)}
            className="min-h-[42px] py-2 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Contact className="w-3.5 h-3.5" />
            <span>Save vCard</span>
          </button>
        </div>

        {qrUrl && (
          <a
            href={qrUrl}
            download={`${identifier}-qr.png`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download QR PNG</span>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Consolidated Unified Share Modal / Drawer entrypoint.
 */
export function ShareModal(props: ShareModalProps) {
  if (!props.isOpen) return null;

  if (props.isOwner === false) {
    return (
      <VisitorPublicShareModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        profile={props.profile}
        onCopySuccess={props.onCopySuccess}
      />
    );
  }

  return <UnifiedShareDrawer {...props} />;
}
