'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, QrCode } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface QRFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
}

export function QRFullscreenModal({ isOpen, onClose, profile }: QRFullscreenModalProps) {
  const [qrUrl, setQrUrl] = useState('');
  const theme = getThemeConfig(profile.theme || 'elegant');
  const identifier = profile.slug || profile.id;
  const canonicalPublicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/profile/${identifier}` 
    : `https://www.avtive.app/profile/${identifier}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(canonicalPublicUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, canonicalPublicUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${profile.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left overflow-y-auto">
      <div className={`relative w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-[32px] ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-4 sm:p-6 text-center space-y-4 sm:space-y-5 transition-colors`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${theme.textMuted} hover:${theme.textPrimary} ${theme.subCardBg} transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Identity */}
        <div className="flex flex-col items-center space-y-2 pt-2">
          <img
            src={profile.avatar}
            alt={profile.name}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
            }}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md"
          />
          <div>
            <h3 className={`text-base font-bold ${theme.textPrimary}`}>
              {profile.name}
            </h3>
            <p className={`text-xs ${theme.accentText} font-semibold`}>
              {profile.designation}
            </p>
          </div>
        </div>

        {/* QR Code Box */}
        <div className={`p-3 sm:p-4 rounded-2xl ${theme.subCardBg} border ${theme.subCardBorder} inline-block shadow-inner`}>
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-xl max-w-full" />
          ) : (
            <div className="w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center text-xs text-[#94A3B8]">
              <QrCode className="w-10 h-10 animate-pulse text-[#94A3B8]" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className={`text-xs ${theme.textSecondary}`}>
            Scan with any camera to immediately view or save this card.
          </p>

          <button
            onClick={handleDownload}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${theme.btnPrimary} font-bold text-xs shadow-xs transition-all active:scale-95`}
          >
            <Download className="w-4 h-4" />
            <span>Download High-Resolution QR (.PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
