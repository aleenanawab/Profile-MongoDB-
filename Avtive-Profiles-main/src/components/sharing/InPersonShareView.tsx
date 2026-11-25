'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ChevronLeft,
  Smartphone,
  QrCode,
  Radio,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  WifiOff,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { ShareLinkClientView } from '@/types/sharing';

type NfcState =
  | 'ready'
  | 'connecting'
  | 'transferring'
  | 'completed'
  | 'failed'
  | 'unsupported';

interface InPersonShareViewProps {
  profile: ProfileData;
  activeLink: ShareLinkClientView | null;
  templateName: string;
  eventLabel: string;
  selectedFieldsCount: number;
  onEnsureShareLink: (channel: 'nfc' | 'qr' | 'link') => Promise<ShareLinkClientView | null>;
  onBack: () => void;
}

export function InPersonShareView({
  profile,
  activeLink,
  templateName,
  eventLabel,
  selectedFieldsCount,
  onEnsureShareLink,
  onBack
}: InPersonShareViewProps) {
  const [subTab, setSubTab] = useState<'nfc' | 'qr' | 'nearby'>('nfc');
  const [nfcState, setNfcState] = useState<NfcState>(() => {
    const supported =
      typeof window !== 'undefined' &&
      'NDEFReader' in window &&
      typeof (window as unknown as { NDEFReader?: unknown }).NDEFReader === 'function';
    return supported ? 'ready' : 'unsupported';
  });
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [mintedLink, setMintedLink] = useState<ShareLinkClientView | null>(null);
  const currentLink = activeLink || mintedLink;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const resolvedUrl = currentLink
    ? currentLink.shareUrl ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}${currentLink.sharePath}`
        : currentLink.sharePath)
    : '';

  // Generate QR automatically when switching to QR tab
  useEffect(() => {
    if (subTab !== 'qr') return;
    let active = true;
    const ensureAndRenderQr = async () => {
      let target = currentLink;
      if (!target) {
        target = await onEnsureShareLink('qr');
        if (active && target) setMintedLink(target);
      }
      if (!target || !active) return;
      const baseUrl =
        target.shareUrl ||
        (typeof window !== 'undefined' ? `${window.location.origin}${target.sharePath}` : target.sharePath);
      const qrUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}src=qr`;
      try {
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 440,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        if (active) setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR error:', err);
      }
    };
    void ensureAndRenderQr();
    return () => {
      active = false;
    };
  }, [subTab, currentLink, onEnsureShareLink]);

  const handleStartNfc = async () => {
    setNfcError(null);
    const NDEFReaderCtor =
      typeof window !== 'undefined'
        ? (window as unknown as {
            NDEFReader?: new () => {
              write: (msg: { records: Array<{ recordType: string; data: string }> }) => Promise<void>;
            };
          }).NDEFReader
        : undefined;

    if (!NDEFReaderCtor) {
      setNfcState('unsupported');
      setNfcError('Web NFC is not supported on this browser or device.');
      return;
    }

    setNfcState('connecting');
    try {
      let target = currentLink;
      if (!target) {
        target = await onEnsureShareLink('nfc');
        if (target) setMintedLink(target);
      }
      if (!target) {
        throw new Error('Could not generate secure share URL before starting NFC.');
      }

      const baseUrl =
        target.shareUrl ||
        (typeof window !== 'undefined' ? `${window.location.origin}${target.sharePath}` : target.sharePath);
      const nfcUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}src=nfc`;

      const ndef = new NDEFReaderCtor();
      setNfcState('transferring');
      await ndef.write({
        records: [{ recordType: 'url', data: nfcUrl }]
      });
      setNfcState('completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'NFC write failed or permission was denied.';
      setNfcState('failed');
      setNfcError(msg);
    }
  };

  const handleCopyFallback = async () => {
    setIsLoadingLink(true);
    try {
      let target = currentLink;
      if (!target) {
        target = await onEnsureShareLink('link');
        if (target) setMintedLink(target);
      }
      if (!target) return;
      const url =
        target.shareUrl ||
        (typeof window !== 'undefined' ? `${window.location.origin}${target.sharePath}` : target.sharePath);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } finally {
      setIsLoadingLink(false);
    }
  };

  const nfcStatusLabel: Record<NfcState, { text: string; badgeClass: string }> = {
    ready: { text: 'Ready to tap', badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
    connecting: { text: 'Connecting...', badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25' },
    transferring: { text: 'Hold near target device/tag...', badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25' },
    completed: { text: 'NFC link written', badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
    failed: { text: 'Transfer failed', badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25' },
    unsupported: { text: 'Web NFC Unsupported', badgeClass: 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/15' }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Back to Share"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
            Share in person
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {templateName} · {selectedFieldsCount} items selected
          </p>
        </div>
      </div>

      {/* Sub-Tabs: Tap Phones / Show QR / Nearby */}
      <div className="px-4 sm:px-5 pt-3.5 shrink-0">
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 gap-1">
          {[
            { id: 'nfc' as const, label: 'Tap phones', icon: Smartphone },
            { id: 'qr' as const, label: 'Show QR', icon: QrCode },
            { id: 'nearby' as const, label: 'Nearby', icon: Radio }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#182032] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
        {/* Tap Phones (Real Web NFC) */}
        {subTab === 'nfc' && (
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-center space-y-4 shadow-2xs">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${nfcStatusLabel[nfcState].badgeClass}`}
              >
                {nfcStatusLabel[nfcState].text}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 py-2">
              <div className="w-16 h-24 rounded-2xl bg-slate-900 dark:bg-white/10 border-2 border-slate-700 dark:border-white/20 flex items-center justify-center text-white font-bold text-base shadow-md">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-amber-500/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                {nfcState === 'transferring' || nfcState === 'connecting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : nfcState === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : nfcState === 'unsupported' || nfcState === 'failed' ? (
                  <WifiOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Radio className="w-5 h-5" />
                )}
              </div>
              <div className="w-16 h-24 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-500 font-bold text-base">
                ?
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {nfcState === 'unsupported'
                  ? 'Web NFC Unavailable on This Browser'
                  : nfcState === 'completed'
                  ? 'Share Link Written via NFC'
                  : 'Write Secure Share Link via NFC'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                {nfcState === 'unsupported'
                  ? 'Web NFC requires Android Chrome over HTTPS. Use Show QR or Copy Link on this device so recipients open your scoped share link immediately.'
                  : 'Tap Start NFC Share and hold your phone near a compatible NFC tag or receiving device to write your scoped share URL.'}
              </p>
            </div>

            {eventLabel && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                <Tag className="w-3 h-3" />
                <span>Label: {eventLabel}</span>
              </div>
            )}

            {nfcError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{nfcError}</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {nfcState !== 'unsupported' ? (
                <button
                  type="button"
                  disabled={nfcState === 'connecting' || nfcState === 'transferring'}
                  onClick={handleStartNfc}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {nfcState === 'connecting' || nfcState === 'transferring'
                    ? 'Waiting for NFC tap...'
                    : nfcState === 'failed' || nfcState === 'completed'
                    ? 'Start NFC Share Again'
                    : 'Start NFC Share'}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubTab('qr')}
                    className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show QR Code</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoadingLink}
                    onClick={handleCopyFallback}
                    className="min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show QR */}
        {subTab === 'qr' && (
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex flex-col items-center space-y-4 text-center shadow-2xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {isLoadingLink || !qrDataUrl ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <img src={qrDataUrl} alt="In-Person QR Code" className="w-48 h-48 rounded-lg" />
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {profile.name}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Point any phone camera to open your {templateName} share link ({selectedFieldsCount} items).
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyFallback}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied' : resolvedUrl ? 'Copy Link' : 'Generate & Copy Link'}</span>
            </button>
          </div>
        )}

        {/* Nearby (Honest Browser Limitation Card) */}
        {subTab === 'nearby' && (
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] space-y-4 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 mx-auto flex items-center justify-center text-slate-500 dark:text-slate-300">
              <WifiOff className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nearby Device Discovery Not Supported
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                Automatic proximity radar across browsers is unavailable without native platform APIs. Use Show QR, Web NFC (on supported Android devices), or Copy Link instead.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSubTab('qr')}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Show QR</span>
              </button>

              <button
                type="button"
                disabled={isLoadingLink}
                onClick={handleCopyFallback}
                className="min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
