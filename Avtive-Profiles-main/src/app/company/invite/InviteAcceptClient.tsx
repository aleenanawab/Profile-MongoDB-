'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  UserCheck, 
  LogOut,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';
import { UserSession } from '@/types/profile';

interface InviteAcceptClientProps {
  initialToken: string;
  session: UserSession | null;
}

export function InviteAcceptClient({ initialToken, session }: InviteAcceptClientProps) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ company?: any; member?: any } | null>(null);

  const handleAccept = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token.trim()) {
      setError('Please provide a valid invitation token.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/company/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation.');
        return;
      }

      setSuccessData(data);
      setTimeout(() => {
        const targetSlug = data.company?.slug || data.company?.id;
        if (targetSlug) {
          router.push(`/profile/${encodeURIComponent(targetSlug)}`);
        } else {
          router.push('/dashboard');
        }
      }, 1800);
    } catch {
      setError('Network error while processing invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnUrl = `/company/invite?token=${encodeURIComponent(token)}`;

  // Shared View Content
  const inviteContent = (
    <div className="w-full max-w-md mx-auto my-auto p-4 sm:p-6 space-y-6 text-left box-border">
      {/* Icon & Title */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Organization Invitation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          You have been invited to join a verified company digital identity pass on Avtive.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">{error}</span>
            {error.includes('different email') && (
              <Link 
                href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                className="inline-block mt-1 font-bold text-cyan-600 dark:text-cyan-400 underline hover:no-underline"
              >
                Sign in with the invited email
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {successData ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Welcome to {successData.company?.name || 'the Team'}!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your membership has been activated. Redirecting you to the company profile...
            </p>
          </div>
          <div className="pt-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mx-auto" />
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
          {session ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {session.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {session.email}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  Logged In
                </span>
              </div>

              <form onSubmit={handleAccept} className="space-y-3">
                {!initialToken && (
                  <div>
                    <label htmlFor="invite-token-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Invitation Token
                    </label>
                    <input
                      id="invite-token-input"
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your invitation token"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !token.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Accepting Invitation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Accept &amp; Join Organization</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You must sign in with your email to accept this company invitation and activate your pass.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="Organization Membership"
      workflowSubtitle="Accept &amp; Connect Company Pass"
      currentUrlPath="/company/invite"
      desktopContent={inviteContent}
      mobileContent={inviteContent}
    />
  );
}
