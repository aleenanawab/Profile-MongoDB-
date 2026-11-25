'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Copy, Check, QrCode, Download, Share2, Contact } from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { downloadVCard } from '@/lib/vcard';

export interface VisitorPublicShareViewProps {
  profile: ProfileData;
  onClose: () => void;
  onCopySuccess?: () => void;
}

/**
 * Full in-page read-only share workspace when a public visitor selects Share.
 * Replaces the profile preview cleanly without modals, overlays, or owner-only tools.
 */
export function VisitorPublicShareView({
  profile,
  onClose,
  onCopySuccess,
}: VisitorPublicShareViewProps) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const identifier = profile.slug || profile.id;
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${identifier}`
      : `https://www.avtive.app/profile/${identifier}`;

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(setQrUrl)
      .catch(() => {});
  }, [publicUrl]);

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
      data-testid="visitor-share-view"
      className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain bg-zinc-50 dark:bg-black text-zinc-950 dark:text-white animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* In-page Workspace Header */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            aria-label="Back to profile"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
              Share {profile.name}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Public Profile Link &amp; QR Code
            </p>
          </div>

          <div className="w-[72px] shrink-0" aria-hidden="true" />
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-6 sm:p-8 space-y-6 text-center shadow-2xs">
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 inline-block">
            {qrUrl ? (
              <img src={qrUrl} alt="Public Profile QR" className="w-44 h-44 rounded-lg" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-zinc-400 animate-pulse" />
              </div>
            )}
          </div>

          <div className="p-2 pl-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-left">
            <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleNativeShare}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Link</span>
            </button>
            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Contact className="w-4 h-4" />
              <span>Save vCard</span>
            </button>
          </div>

          {qrUrl && (
            <div>
              <a
                href={qrUrl}
                download={`${identifier}-qr.png`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR PNG</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
