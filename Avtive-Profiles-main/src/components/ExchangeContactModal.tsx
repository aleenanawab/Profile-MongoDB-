'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Send, User, Mail, Phone, Building2, CheckCircle2 } from 'lucide-react';
import { ProfileData, UserSession } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface ExchangeContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  session?: UserSession | null;
  onSuccess?: () => void;
}

export function ExchangeContactModal({
  isOpen,
  onClose,
  profile,
  session,
  onSuccess
}: ExchangeContactModalProps) {
  const [formData, setFormData] = useState({
    name: session?.name || '',
    email: session?.email || '',
    phone: '',
    company: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const theme = getThemeConfig(profile.theme || 'elegant');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/profile/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          contactInfo: formData
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to exchange contact details.');
      }

      setSubmitted(true);
      try {
        const confettiColors = profile.theme === 'elegant'
          ? ['#B88746', '#E5B869', '#FAF7F2']
          : profile.theme === 'modern'
          ? ['#10B981', '#34D399', '#071511']
          : profile.theme === 'minimal'
          ? ['#111111', '#555555', '#FFFFFF']
          : ['#B88746', '#E5B869', '#FAF7F2'];
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: confettiColors
        });
      } catch (e) {}

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to share details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left overflow-y-auto">
      <div className={`relative w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-[32px] ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-5 sm:p-6 space-y-4 transition-colors`}>
        {/* Header with Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full overflow-hidden border ${theme.cardBorder} shrink-0`}>
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
                }}
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h3 className={`text-xs font-bold ${theme.textPrimary}`}>
                Connect with {profile.name}
              </h3>
              <p className={`text-[10px] ${theme.textMuted} font-medium`}>{profile.company || 'Active'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${theme.textMuted} hover:${theme.textPrimary} ${theme.subCardBg} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className={`w-12 h-12 rounded-full ${theme.badgeBg} ${theme.accentText} mx-auto flex items-center justify-center`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className={`text-sm font-bold ${theme.textPrimary}`}>
              Details Shared Successfully!
            </h4>
            <p className={`text-xs ${theme.textSecondary}`}>
              {profile.name} has received your contact details.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className={`text-xs ${theme.textSecondary}`}>
              Leave your details to establish a direct connection with {profile.name}.
            </p>

            <div className="space-y-2">
              <div className="relative">
                <User className={`absolute left-3 top-2.5 w-4 h-4 ${theme.textMuted}`} />
                <input
                  type="text"
                  required
                  placeholder="Your Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl ${theme.subCardBg} border ${theme.subCardBorder} text-xs ${theme.textPrimary} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-current`}
                />
              </div>

              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-4 h-4 ${theme.textMuted}`} />
                <input
                  type="email"
                  required
                  placeholder="Your Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl ${theme.subCardBg} border ${theme.subCardBorder} text-xs ${theme.textPrimary} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-current`}
                />
              </div>

              <div className="relative">
                <Phone className={`absolute left-3 top-2.5 w-4 h-4 ${theme.textMuted}`} />
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl ${theme.subCardBg} border ${theme.subCardBorder} text-xs ${theme.textPrimary} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-current`}
                />
              </div>

              <div className="relative">
                <Building2 className={`absolute left-3 top-2.5 w-4 h-4 ${theme.textMuted}`} />
                <input
                  type="text"
                  placeholder="Company / Organization"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl ${theme.subCardBg} border ${theme.subCardBorder} text-xs ${theme.textPrimary} placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-current`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl ${theme.btnPrimary} font-bold text-xs shadow-xs transition-all active:scale-95 mt-2`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sharing...' : 'Share Contact Details'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
