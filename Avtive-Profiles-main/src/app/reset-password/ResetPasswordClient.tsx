'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  KeyRound,
  Check
} from 'lucide-react';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

export default function ResetPasswordClient() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasValidTokenParam, setHasValidTokenParam] = useState(true);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tokenParam = sp.get('token');
      const emailParam = sp.get('email');
      const rawReturn = sp.get('returnUrl');

      if (rawReturn) {
        setReturnUrl(rawReturn);
      }

      // Also check hash for Supabase auth recovery flow: #access_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashAccessToken = hashParams.get('access_token');
      const hashType = hashParams.get('type');

      if (tokenParam) {
        setToken(tokenParam);
      } else if (hashAccessToken && hashType === 'recovery') {
        setToken(hashAccessToken);
      } else {
        setHasValidTokenParam(false);
      }

      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new link.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try built-in custom auth password reset endpoint
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to reset password. The link may have expired.');
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMessage('A network error occurred while updating your password. Please try again.');
      setIsLoading(false);
    }
  };

  const formCardContent = (
    <>
      {isSuccess ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Password Updated!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your password has been successfully updated. You can now use your new credentials to sign in.
            </p>
          </div>
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                const target = returnUrl
                  ? `/login?reset=success&returnUrl=${encodeURIComponent(returnUrl)}`
                  : '/login?reset=success';
                router.push(target);
              }}
              className="w-full py-3 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 dark:shadow-black/30 transition-all cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-[11px] font-semibold mb-1">
              <KeyRound className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
              <span>Security Reset</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Set New Password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please enter and confirm your new secure password.
            </p>
          </div>

          {!hasValidTokenParam && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Reset Link Incomplete</p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
                  No reset token was detected in the URL. If you copied the link manually, verify the full link, or{' '}
                  <Link href="/login" className="underline font-bold text-amber-700 dark:text-amber-300 hover:underline">
                    request a new one here
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-[11px]">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {!email && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your account email"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:bg-white dark:focus:bg-[#070D18] transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:bg-white dark:focus:bg-[#070D18] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:bg-white dark:focus:bg-[#070D18] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white p-1"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 dark:shadow-black/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );

  const desktopView = (
    <div className="w-full flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
      <div className="w-full max-w-[440px] mb-5 flex flex-col items-center text-center">
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 mb-3 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-sm">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Avtive</span>
        </div>
      </div>

      <div className="w-full max-w-[440px] rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/60 transition-colors">
        {formCardContent}
      </div>
    </div>
  );

  const mobileView = (
    <div className="w-full min-h-0 flex-1 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[340px] rounded-2xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 p-5 shadow-lg">
        {formCardContent}
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="Reset Password"
      workflowSubtitle="Secure Password Reset"
      currentUrlPath="/reset-password"
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}
