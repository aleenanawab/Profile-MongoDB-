import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Wifi, X, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface NFCTapModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSaveContact: () => void;
  onExchangeContact: () => void;
}

export function NFCTapModal({
  isOpen,
  onClose,
  profile,
  onSaveContact,
  onExchangeContact
}: NFCTapModalProps) {
  const [phase, setPhase] = useState<'tapping' | 'connected'>('tapping');
  const theme = getThemeConfig(profile.theme || 'elegant');

  useEffect(() => {
    if (isOpen) {
      setPhase('tapping');
      const timer = setTimeout(() => {
        setPhase('connected');
        try {
          const confettiColors = profile.theme === 'elegant'
            ? ['#B88746', '#E5B869', '#FAF7F2']
            : profile.theme === 'modern'
            ? ['#10B981', '#34D399', '#071511']
            : profile.theme === 'minimal'
            ? ['#111111', '#555555', '#FFFFFF']
            : ['#B88746', '#E5B869', '#FAF7F2'];
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.5 },
            colors: confettiColors
          });
        } catch (e) {}
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, profile.theme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left overflow-y-auto">
      <div className={`relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[32px] ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-4 sm:p-6 text-center ${theme.textPrimary} space-y-4 transition-colors`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${theme.textMuted} hover:${theme.textPrimary} ${theme.subCardBg} transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>

        {phase === 'tapping' ? (
          <div className="py-6 space-y-5">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full ${theme.badgeBg} animate-ping`} />
              <div className={`absolute inset-2 rounded-full ${theme.badgeBg} animate-pulse`} />
              <div className={`relative z-10 w-14 h-14 rounded-full ${theme.btnPrimary} flex items-center justify-center shadow-lg border ${theme.subCardBorder}`}>
                <Wifi className="w-7 h-7 rotate-90" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className={`text-base font-bold ${theme.textPrimary}`}>
                Reading Avtive Smart NFC Chip...
              </h3>
              <p className={`text-xs ${theme.textSecondary}`}>
                Hold smartphone near card
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto">
              <img
                src={profile.avatar}
                alt={profile.name}
                className={`w-full h-full object-cover rounded-full border-2 ${theme.cardBorder} shadow-md`}
              />
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${theme.badgeBg} ${theme.accentText}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.accentText} font-mono`}>
                Connected via Contactless NFC
              </span>
              <h3 className={`text-base font-bold ${theme.textPrimary}`}>
                {profile.name}
              </h3>
              <p className={`text-xs ${theme.textSecondary}`}>
                {profile.company || profile.designation}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  onSaveContact();
                  onClose();
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${theme.btnPrimary} font-bold text-xs shadow-xs transition-all active:scale-95`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Save Contact to Phone (.vcf)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onExchangeContact();
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${theme.btnSecondary} font-bold text-xs border ${theme.cardBorder} transition-colors`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>Exchange Contact</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
