'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, ArrowRight } from 'lucide-react';
import { sanitizeReturnUrl, resolveReturnUrlForExistingUser } from '@/lib/utils';

export function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.76v-7.6H6.46M7.84 6.2a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6c0-.89-.72-1.6-1.6-1.6Z" />
    </svg>
  );
}

export function GitHubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export type SocialProvider = 'google' | 'linkedin' | 'github' | 'facebook';

interface SocialAuthOptionsProps {
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export function SocialAuthOptions({ onSuccess, onError }: SocialAuthOptionsProps) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialAuth = async (provider: SocialProvider, email?: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email, name })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to authenticate with ${provider}.`);
      }

      setIsModalOpen(false);
      if (onSuccess) onSuccess();

      const rawReturnUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('returnUrl') : null;
      const returnUrl = sanitizeReturnUrl(rawReturnUrl, null);

      if (data.hasProfile && (data.profileSlug || data.user?.id)) {
        // EXISTING SOCIAL USER -> Direct to their own profile in VIEW MODE
        const targetSlug = data.profileSlug || data.user?.id;
        const userProfileUrl = `/profile/${targetSlug}`;
        const destination = resolveReturnUrlForExistingUser(returnUrl, userProfileUrl);
        router.push(destination);
      } else {
        // NEW SOCIAL USER -> Must complete Role -> Theme/Skip -> Existing Editor
        try {
          localStorage.removeItem('avtive_last_saved_profile');
          sessionStorage.removeItem('avtive_open_edit_mode');
        } catch {}
        router.push('/onboarding/role');
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (onError) onError(err.message || 'Social login failed. Please try again.');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  const openAccountPrompt = (provider: SocialProvider) => {
    setActiveProvider(provider);
    if (provider === 'google') {
      setCustomEmail('aleenaknawab@gmail.com');
      setCustomName('Aleena Nawab');
    } else if (provider === 'linkedin') {
      setCustomEmail('aleena.nawab@linkedin.com');
      setCustomName('Aleena Nawab');
    } else if (provider === 'github') {
      setCustomEmail('aleena.dev@github.com');
      setCustomName('Aleena Developer');
    } else if (provider === 'facebook') {
      setCustomEmail('aleena.social@facebook.com');
      setCustomName('Aleena Nawab');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Social Buttons: Google, LinkedIn, GitHub, Facebook */}
      <div className="grid grid-cols-2 gap-2">
        {/* Google */}
        <button
          type="button"
          onClick={() => openAccountPrompt('google')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121216] dark:hover:bg-[#1A1A22] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading && activeProvider === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
          ) : (
            <GoogleIcon className="w-4 h-4 shrink-0" />
          )}
          <span>Google</span>
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={() => openAccountPrompt('linkedin')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121216] dark:hover:bg-[#1A1A22] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading && activeProvider === 'linkedin' ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
          ) : (
            <LinkedInIcon className="w-4 h-4 shrink-0" />
          )}
          <span>LinkedIn</span>
        </button>

        {/* GitHub */}
        <button
          type="button"
          onClick={() => openAccountPrompt('github')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121216] dark:hover:bg-[#1A1A22] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading && activeProvider === 'github' ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
          ) : (
            <GitHubIcon className="w-4 h-4 shrink-0" />
          )}
          <span>GitHub</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={() => openAccountPrompt('facebook')}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121216] dark:hover:bg-[#1A1A22] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading && activeProvider === 'facebook' ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
          ) : (
            <FacebookIcon className="w-4 h-4 shrink-0" />
          )}
          <span>Facebook</span>
        </button>
      </div>

      {/* Modern Divider */}
      <div className="relative flex items-center justify-center py-1">
        <div className="border-t border-slate-200 dark:border-white/10 w-full" />
        <span className="bg-white dark:bg-[#121216] px-3 text-[10px] uppercase tracking-wider text-slate-400 font-mono shrink-0">
          Or continue with email
        </span>
        <div className="border-t border-slate-200 dark:border-white/10 w-full" />
      </div>

      {/* Account Picker Modal for Social Sign In */}
      {isModalOpen && activeProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/15 p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeProvider === 'google' && <GoogleIcon className="w-5 h-5" />}
                {activeProvider === 'linkedin' && <LinkedInIcon className="w-5 h-5" />}
                {activeProvider === 'github' && <GitHubIcon className="w-5 h-5" />}
                {activeProvider === 'facebook' && <FacebookIcon className="w-5 h-5" />}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                  Sign in with {activeProvider}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Continue with your verified {activeProvider} account to instantly access your digital profile.
            </p>

            {/* Account Info Form */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Aleena Nawab"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#1A1A22] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder={`user@${activeProvider}.com`}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#1A1A22] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth(activeProvider, customEmail, customName)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as {customName.split(' ')[0] || 'User'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth(activeProvider)}
                className="w-full py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Or 1-Click Instant Demo Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
