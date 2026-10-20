'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode, Share2 } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface QRCodeCardProps {
  profile: ProfileData;
  onOpenQRModal: () => void;
  onCopyLink: () => void;
  onOpenShare?: () => void;
  isDark?: boolean;
}

export function QRCodeCard({ profile, onOpenQRModal, onCopyLink, onOpenShare }: QRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const theme = getThemeConfig(profile.theme || 'elegant');

  useEffect(() => {
    const identifier = profile.slug || profile.id;
    const canonicalPublicUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/profile/${identifier}` 
      : `https://www.avtive.app/profile/${identifier}`;

    QRCode.toDataURL(canonicalPublicUrl, {
      width: 260,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error(err));
  }, [profile]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${profile.slug}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className={`px-6 sm:px-8 py-5 ${theme.cardBg} transition-colors`}>
      <div className={`p-4 sm:p-5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} flex items-center gap-4 text-left shadow-2xs`}>
        {/* QR Box */}
        <div
          onClick={onOpenShare || onOpenQRModal}
          className={`cursor-pointer w-22 h-22 sm:w-24 sm:h-24 rounded-2xl ${theme.cardBg} p-2 shadow-xs border ${theme.cardBorder} shrink-0 flex items-center justify-center hover:scale-105 transition-transform`}
        >
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
          )}
        </div>

        {/* QR Info & Actions */}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h3 className={`text-sm font-bold ${theme.textPrimary}`}>
              Scan to Save My Profile
            </h3>
            <p className={`text-[11px] ${theme.textSecondary}`}>
              Scan with your phone camera to view or save digital card.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleDownloadQR}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${theme.btnSecondary} text-[11px] font-bold transition-colors shadow-2xs`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save QR</span>
            </button>

            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${theme.btnPrimary} text-[11px] font-bold transition-colors shadow-2xs`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
