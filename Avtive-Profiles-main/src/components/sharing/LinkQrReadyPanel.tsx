'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ChevronLeft,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Contact,
  FileDown,
  Mail,
  Loader2,
  Clock,
  ShieldCheck,
  Users,
  Tag
} from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { ShareExpiryOption, ShareLinkClientView } from '@/types/sharing';
import { summarizeShareExclusions } from '@/lib/sharing/sanitize';
import { sanitizeProfileForShare } from '@/lib/sharing/sanitize';
import { downloadVCard } from '@/lib/vcard';
import { generateCardPdf } from '@/lib/cardPdfGenerator';

interface LinkQrReadyPanelProps {
  profile: ProfileData;
  link: ShareLinkClientView;
  emailConfigured: boolean;
  onBack: () => void;
  onUpdateLink: (updated: ShareLinkClientView) => void;
  onEditRecipients: () => void;
  isDark?: boolean;
}

export function LinkQrReadyPanel({
  profile,
  link,
  emailConfigured,
  onBack,
  onUpdateLink,
  onEditRecipients,
  isDark = false
}: LinkQrReadyPanelProps) {
  const [qrStyle, setQrStyle] = useState<'classic' | 'framed'>('classic');
  const [qrState, setQrState] = useState<{ urlKey: string; dataUrl: string }>({ urlKey: '', dataUrl: '' });
  const [copied, setCopied] = useState(false);
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const shareUrl = link.shareUrl || (typeof window !== 'undefined' ? `${window.location.origin}${link.sharePath}` : link.sharePath);
  const qrTargetUrl = shareUrl ? `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}src=qr` : '';
  const qrKey = `${qrTargetUrl}::${qrStyle}`;
  const qrDataUrl = qrState.urlKey === qrKey ? qrState.dataUrl : '';
  const isGeneratingQr = Boolean(qrTargetUrl && qrState.urlKey !== qrKey);

  useEffect(() => {
    if (!qrTargetUrl) return;
    let cancelled = false;
    QRCode.toDataURL(qrTargetUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: qrStyle === 'framed' ? '#0F172A' : '#000000',
        light: '#FFFFFF'
      }
    })
      .then((url) => {
        if (!cancelled) {
          setQrState({ urlKey: qrKey, dataUrl: url });
        }
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
        if (!cancelled) {
          setQrState({ urlKey: qrKey, dataUrl: '' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [qrTargetUrl, qrStyle, qrKey]);

  const exclusionSummary = summarizeShareExclusions(profile, link.selectedFields);
  const sanitizedProfile = sanitizeProfileForShare(profile, { selectedFields: link.selectedFields });

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setActionStatus({ type: 'success', message: 'Secure link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setActionStatus({ type: 'error', message: 'Clipboard access blocked. Copy the URL manually.' });
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `avtive-share-qr-${profile.slug || profile.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setActionStatus({ type: 'success', message: 'QR PNG downloaded.' });
  };

  const handleDownloadVCard = () => {
    try {
      downloadVCard(sanitizedProfile);
      setActionStatus({ type: 'success', message: 'Scoped vCard (.vcf) downloaded.' });
    } catch {
      setActionStatus({ type: 'error', message: 'Failed to export vCard.' });
    }
  };

  const handleDownloadCardPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateCardPdf(sanitizedProfile, isDark, qrTargetUrl);
      setActionStatus({ type: 'success', message: 'Scoped Digital Card PDF downloaded.' });
    } catch {
      setActionStatus({ type: 'error', message: 'Failed to generate card PDF.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: link.title || `${profile.name} · Avtive Profile`,
          text: link.eventLabel ? `Shared profile (${link.eventLabel})` : `Shared Avtive profile for ${profile.name}`,
          url: shareUrl
        });
        setActionStatus({ type: 'success', message: 'Shared via device share sheet.' });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopy();
  };

  const handleExpiryChange = async (nextExpiry: ShareExpiryOption) => {
    if (nextExpiry === link.expiryOption) return;
    setIsUpdatingExpiry(true);
    setActionStatus(null);
    try {
      const res = await fetch(`/api/share/links/${encodeURIComponent(link.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryOption: nextExpiry })
      });
      const data = await res.json();
      if (!res.ok || !data.link) {
        throw new Error(data.error || 'Failed to update expiry option.');
      }
      onUpdateLink(data.link);
      setActionStatus({ type: 'success', message: 'Expiry setting updated.' });
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Could not update expiry.' });
    } finally {
      setIsUpdatingExpiry(false);
    }
  };

  const emailRecipients = link.recipients.filter((r) => Boolean(r.email));

  const handleSendEmail = async () => {
    if (!emailConfigured || emailRecipients.length === 0) return;
    setIsSendingEmail(true);
    setActionStatus(null);
    try {
      const res = await fetch('/api/share/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareLinkId: link.id,
          recipients: emailRecipients
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email.');
      }
      setActionStatus({
        type: 'success',
        message: `Email sent to ${data.sent?.length || emailRecipients.length} recipient(s).`
      });
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Email delivery failed.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Back to Share settings"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Your link is ready
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {link.title}
            </p>
          </div>
        </div>

        <a
          href={link.sharePath || shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-1 shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Open</span>
        </a>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
        {actionStatus && (
          <div
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
              actionStatus.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
            }`}
          >
            {actionStatus.message}
          </div>
        )}

        {/* QR Code Display Box (SH4) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex flex-col items-center space-y-3.5 shadow-2xs">
          <div
            className={`p-3 rounded-2xl bg-white shadow-sm border-2 transition-all ${
              qrStyle === 'framed' ? 'border-amber-500/70 ring-4 ring-amber-500/10' : 'border-slate-200'
            }`}
          >
            {isGeneratingQr || !qrDataUrl ? (
              <div className="w-40 h-40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <img
                src={qrDataUrl}
                alt="Permission-scoped Share QR Code"
                className="w-40 h-40 rounded-lg object-contain"
              />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQrStyle('classic')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                qrStyle === 'classic'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
              }`}
            >
              Classic QR
            </button>
            <button
              type="button"
              onClick={() => setQrStyle('framed')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                qrStyle === 'framed'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
              }`}
            >
              Accent Frame
            </button>
          </div>

          {/* Secure URL + Copy button */}
          <div className="w-full p-2 pl-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate select-all">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            This QR code points strictly to your permission-scoped share link.
          </p>
        </div>

        {/* Scope & Exclusion Summary Banner */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-start gap-3">
          <span className="px-2 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-mono font-bold shrink-0">
            {link.selectedFields.length} ITEMS
          </span>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-white">
              {link.templateName || 'Custom selection'}.{' '}
            </span>
            {exclusionSummary.neverShareFields.length > 0 && (
              <span>
                Never Share protected ({exclusionSummary.neverShareFields.join(', ')}) omitted.{' '}
              </span>
            )}
            {exclusionSummary.excludedNormalLabels.length > 0 && (
              <span>
                Excluded: {exclusionSummary.excludedNormalLabels.slice(0, 4).join(', ')}
                {exclusionSummary.excludedNormalLabels.length > 4
                  ? ` +${exclusionSummary.excludedNormalLabels.length - 4} more`
                  : ''}.
              </span>
            )}
          </div>
        </div>

        {/* Shared With & Event */}
        {(link.recipients.length > 0 || link.eventLabel) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Shared With
              </span>
              <button
                type="button"
                onClick={onEditRecipients}
                className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-200 hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {link.recipients.map((r) => (
                <span
                  key={r.id}
                  className="px-2.5 py-1 rounded-full bg-slate-900 text-white dark:bg-white/15 dark:text-white text-[11px] font-semibold"
                >
                  {r.name}
                </span>
              ))}
              {link.eventLabel && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-semibold inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {link.eventLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Expiry Selector (SH4) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Link Stops Working
            </span>
            {isUpdatingExpiry && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'never' as const, label: 'Never' },
              { key: '7d' as const, label: 'In 7 days' },
              { key: '1_view' as const, label: 'After 1 view' }
            ].map((opt) => {
              const active = link.expiryOption === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={isUpdatingExpiry}
                  onClick={() => handleExpiryChange(opt.key)}
                  className={`min-h-[40px] py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Expiry, 1-view lock, and revocation are strictly enforced on the server.</span>
          </p>
        </div>

        {/* Sharing Action Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleNativeShare}
            className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Send / Share</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQrPng}
            disabled={!qrDataUrl}
            className="min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download QR PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadVCard}
            className="min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Contact className="w-4 h-4" />
            <span>Download vCard</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCardPdf}
            disabled={isDownloadingPdf}
            className="min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            <span>Card PDF</span>
          </button>
        </div>

        {/* Optional Email Delivery (only shown when server email service is configured) */}
        {emailConfigured && emailRecipients.length > 0 && (
          <button
            type="button"
            disabled={isSendingEmail}
            onClick={handleSendEmail}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>Send Share Link by Email to {emailRecipients.length} Recipient(s)</span>
          </button>
        )}
      </div>
    </div>
  );
}
