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
  ArrowRight,
  ArrowLeft,
  Mail,
  ExternalLink,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { sanitizeReturnUrl, resolveReturnUrlForExistingUser } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function LoginClient() {
  const router = useRouter();
  const { theme, setTheme, isDark } = usePortfolioTheme();

  // Dynamic theme styling matching chosen theme
  const themeStyles = React.useMemo(() => {
    switch (theme) {
      case 'cyber':
        return {
          gradient: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500',
          gradientBadge: 'from-emerald-500 to-teal-600',
          textLink: 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
          ringFocus: 'focus:ring-emerald-500/50 focus:border-emerald-500',
          shadowPill: 'shadow-emerald-600/20 dark:shadow-emerald-950/40',
        };
      case 'luxe':
        return {
          gradient: 'from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500',
          gradientBadge: 'from-rose-500 to-pink-600',
          textLink: 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300',
          ringFocus: 'focus:ring-rose-500/50 focus:border-rose-500',
          shadowPill: 'shadow-rose-600/20 dark:shadow-rose-950/40',
        };
      case 'editorial':
      default:
        return {
          gradient: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
          gradientBadge: 'from-cyan-500 to-blue-600',
          textLink: 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300',
          ringFocus: 'focus:ring-cyan-500/50 focus:border-cyan-500',
          shadowPill: 'shadow-cyan-600/20 dark:shadow-black/20',
        };
    }
  }, [theme]);

  // Shared Application State between Desktop & Mobile Working Screens
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Flow State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotErrorMessage, setForgotErrorMessage] = useState<string | null>(null);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotResetUrl, setForgotResetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlTheme = sp.get('theme');
      if (urlTheme === 'editorial' || urlTheme === 'cyber' || urlTheme === 'luxe') {
        setTheme(urlTheme);
      }
      if (sp.get('registered') === 'true') {
        setSuccessMessage('Account created successfully! Please sign in below.');
      }
      if (sp.get('reset') === 'success') {
        setSuccessMessage('Password successfully updated! Please sign in with your new password.');
      }
      if (sp.get('error')) {
        setErrorMessage(decodeURIComponent(sp.get('error')!));
      }

      // Prefill email if provided in query string or remembered, never prefill password or demo credentials
      const queryEmail = sp.get('email');
      if (queryEmail) {
        setEmail(queryEmail);
      } else {
        try {
          const savedEmail = localStorage.getItem('avtive_remembered_identifier');
          if (savedEmail) {
            setEmail(savedEmail);
          }
        } catch {}
      }
      // Strictly ensure password input is never prefilled with demo credentials or passwords
      setPassword('');
      try {
        sessionStorage.removeItem('avtive_temp_reg_creds');
      } catch {}
    }
  }, [setTheme]);

  // Clear temporary registration credentials on unmount if unused
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('avtive_temp_reg_creds');
        } catch {}
      }
    };
  }, []);

  const getReturnUrl = () => {
    if (typeof window === 'undefined') return null;
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get('returnUrl') || sp.get('redirect') || sp.get('next');
    return sanitizeReturnUrl(raw, null);
  };

  // Login Flow: Whenever anyone visits/opens the website, always show the Login page first.
  // Do not automatically redirect on mount. Authenticated flow proceeds only after user login interaction.

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const returnUrl = getReturnUrl();
      const authUrl = `/api/auth/google${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
      window.location.href = authUrl;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err?.message || 'Google authentication could not be initiated.');
      setIsLoading(false);
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = trimmedEmail.toLowerCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      let data: any;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse login response:', parseErr);
        setErrorMessage('Server returned a malformed response. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMessage(data?.error || 'Invalid email or password. Please verify your credentials.');
        } else if (res.status === 403) {
          setErrorMessage(data?.error || 'Your session has expired or access is denied. Please sign in again.');
        } else if (res.status >= 500) {
          setErrorMessage(data?.error || 'A server error occurred. Please try again in a few moments.');
        } else {
          setErrorMessage(data?.error || 'Unable to log in. Please check your credentials and try again.');
        }
        setIsLoading(false);
        return;
      }

      try {
        sessionStorage.removeItem('avtive_temp_reg_creds');
        sessionStorage.setItem('avtive_active_session', 'true');
        localStorage.setItem('avtive_returning_user', 'true');
        localStorage.setItem('avtive_remembered_identifier', normalizedEmail);
      } catch {}

      const returnUrl = getReturnUrl();
      const serverRedirect = data.redirectTo;
      let targetPath = serverRedirect || '/onboarding/role';

      if (data.onboardingCompleted && (data.profileSlug || data.user?.id)) {
        // EXISTING USER DETECTED -> Direct to their saved profile (Company or Individual) in VIEW MODE (PREVIEW)
        const userProfileUrl = serverRedirect || `/profile/${data.profileSlug || data.user.id}`;
        targetPath = resolveReturnUrlForExistingUser(returnUrl, userProfileUrl);
        if (targetPath === '/profile' || targetPath === '/profile/' || targetPath === '/my-profile') {
          targetPath = userProfileUrl;
        }
      } else if (returnUrl && !returnUrl.startsWith('/login') && !returnUrl.startsWith('/register')) {
        targetPath = returnUrl;
      } else if (!serverRedirect) {
        // INCOMPLETE ONBOARDING DETECTED -> Resume the missing step
        const userRole = data.role || data.user?.role;
        const userTheme = data.user?.preferredTheme;
        if (!userRole) {
          targetPath = '/onboarding/role';
        } else if (!userTheme) {
          targetPath = `/onboarding/theme?role=${encodeURIComponent(userRole)}`;
        } else {
          targetPath = `/edit-profile?role=${encodeURIComponent(userRole)}&theme=${encodeURIComponent(userTheme)}`;
        }
      }

      window.location.href = targetPath;
    } catch (err) {
      console.error(err);
      setErrorMessage('Unable to connect to the server. Please check your network connection and try again.');
      setIsLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMessage(null);
    setForgotSuccessMessage(null);
    setForgotResetUrl(null);

    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setForgotErrorMessage('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setForgotErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSendingReset(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotErrorMessage(data.error || 'Failed to request password reset. Please try again.');
        setIsSendingReset(false);
        return;
      }

      setForgotSuccessMessage(
        data.message || 'If an account exists with this email address, a password reset link has been sent.'
      );
      if (data.resetUrl) {
        setForgotResetUrl(data.resetUrl);
      }
      setIsSendingReset(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotErrorMessage('Network error occurred. Please try again.');
      setIsSendingReset(false);
    }
  };

  const openForgotPasswordView = () => {
    window.location.href = `/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`;
  };

  const closeForgotPasswordView = () => {
    setShowForgotPassword(false);
    setForgotErrorMessage(null);
    setForgotSuccessMessage(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WORKING SCREEN REPRESENTATION
  // Clean, focused single-panel login (Marketing section completely removed)
  // Fully theme-aware: Light Mode = crisp white; Dark Mode = original #0E1528
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full max-w-md mx-auto my-auto py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      
      {/* Centered Avtive Brand Header */}
      <div className="flex flex-col items-center justify-center mb-6 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${themeStyles.gradientBadge} flex items-center justify-center font-extrabold text-white text-base shadow-sm`}>
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Avtive</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Digital Identity Workspace</p>
      </div>

      {/* Main Login Card - Adapts to Theme (White in Light Mode, #0E1528 in Dark Mode) */}
      <div className="w-full rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-black/60 p-6 sm:p-8 space-y-5 text-left transition-colors">
        
        {showForgotPassword ? (
          /* Forgot Password Sub-Flow */
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={closeForgotPasswordView}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Forgot Password?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your email address and we&apos;ll send you a password reset link.
              </p>
            </div>

            {forgotSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{forgotResetUrl ? 'Recovery Link Ready' : 'Password Reset Email Sent'}</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                  {forgotSuccessMessage}
                </p>
              </div>
            )}

            {forgotResetUrl && (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-800 dark:text-slate-100 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-cyan-700 dark:text-cyan-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <span>One-Time Direct Reset Link</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Since SMTP email delivery is unconfigured in this environment, click below to set your new password using this verified server token:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                  <Link
                    href={forgotResetUrl}
                    className={`py-2 px-3.5 rounded-xl bg-gradient-to-r ${themeStyles.gradient} text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer`}
                  >
                    <span>Reset Password Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(forgotResetUrl);
                      alert('Reset link copied to clipboard!');
                    }}
                    className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            )}

            {forgotErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. aleena@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${themeStyles.ringFocus} focus:bg-white dark:focus:bg-[#070D18] transition-all`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingReset}
                className={`w-full min-h-[44px] py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r ${themeStyles.gradient} text-white shadow-md ${themeStyles.shadowPill} transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isSendingReset ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={closeForgotPasswordView}
                className="text-xs min-h-[44px] inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Remember your password? <span className={`font-semibold ${themeStyles.textLink} hover:underline ml-1`}>Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          /* Regular Sign In Form */
          <>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your credentials or authenticate via Google
              </p>
            </div>

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aleena@example.com"
                  className={`w-full px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${themeStyles.ringFocus} focus:bg-white dark:focus:bg-[#070D18] transition-all`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={openForgotPasswordView}
                    className={`text-xs font-medium min-h-[44px] inline-flex items-center ${themeStyles.textLink} hover:underline cursor-pointer`}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-4 pr-12 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${themeStyles.ringFocus} focus:bg-white dark:focus:bg-[#070D18] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full min-h-[44px] py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r ${themeStyles.gradient} text-white shadow-md ${themeStyles.shadowPill} transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-white/10 w-full" />
              <span className="bg-white dark:bg-[#0E1528] px-3 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">or</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className={`font-bold ${themeStyles.textLink} hover:underline ml-1`}>
                Sign Up
              </Link>
            </div>
          </>
        )}

      </div>

    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE WORKING SCREEN REPRESENTATION
  // Minimalist, focused exclusively on authentication
  // Theme-aware: adapts cleanly to Light Mode and Dark Mode
  // Fits 100% inside phone viewport with 0 overflow
  // ──────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="w-full max-w-full box-border px-4 sm:px-5 py-3 flex-1 flex flex-col justify-between text-left overflow-x-hidden">
      
      <div className="w-full max-w-full box-border">
        {/* Single Unified Mobile Header: Branding + Action Title */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-4 text-center">
          <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${themeStyles.gradientBadge} flex items-center justify-center font-extrabold text-white text-xs shadow-sm shrink-0`}>
            A
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {showForgotPassword ? 'Reset Password' : 'Sign In'}
          </h1>
        </div>

        {showForgotPassword ? (
          /* Mobile Forgot Password View */
          <div className="w-full max-w-full box-border space-y-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Enter your email address and we&apos;ll send you a password reset link.
            </p>

            {forgotSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1 box-border">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px]">{forgotResetUrl ? 'Recovery Link Ready' : 'Password Reset Email Sent'}</span>
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-200">
                  {forgotSuccessMessage}
                </p>
              </div>
            )}

            {forgotResetUrl && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-800 dark:text-slate-100 text-xs space-y-2 box-border">
                <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-700 dark:text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <span>One-Time Direct Reset Link</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                  Since SMTP email delivery is unconfigured, proceed with this verified server token:
                </p>
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <Link
                    href={forgotResetUrl}
                    className={`py-2 px-3 rounded-lg bg-gradient-to-r ${themeStyles.gradient} text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer`}
                  >
                    <span>Reset Password Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(forgotResetUrl);
                      alert('Reset link copied to clipboard!');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-medium text-[10px] flex items-center justify-center gap-1 border border-slate-200 dark:border-white/10 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            )}

            {forgotErrorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 box-border">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">{forgotErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendResetLink} className="w-full max-w-full box-border space-y-3">
              <div className="space-y-1 w-full box-border">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative w-full box-border">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. aleena@example.com"
                    className={`w-full max-w-full box-border pl-9 pr-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#1B1E26] border border-slate-200 dark:border-white/15 text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${themeStyles.ringFocus} transition-all`}
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-1 w-full box-border">
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className={`w-full max-w-full box-border min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r ${themeStyles.gradient} text-white shadow-md ${themeStyles.shadowPill} transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={closeForgotPasswordView}
                className="text-[11px] min-h-[44px] inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Back to <span className={`font-semibold ${themeStyles.textLink} hover:underline ml-1`}>Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          /* Mobile Sign In Form */
          <>
            {successMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 box-border">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 box-border">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full max-w-full box-border space-y-3">
              <div className="space-y-1 w-full box-border">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aleena@example.com"
                  className={`w-full max-w-full box-border px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#1B1E26] border border-slate-200 dark:border-white/15 text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${themeStyles.ringFocus} transition-all`}
                />
              </div>

              <div className="space-y-1 w-full box-border">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={openForgotPasswordView}
                    className={`text-[11px] font-medium min-h-[44px] inline-flex items-center ${themeStyles.textLink} hover:underline cursor-pointer`}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative w-full box-border">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full max-w-full box-border pl-3.5 pr-11 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#1B1E26] border border-slate-200 dark:border-white/15 text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${themeStyles.ringFocus} transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 w-full box-border">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full max-w-full box-border min-h-[44px] py-3 px-5 rounded-xl font-bold text-xs bg-gradient-to-r ${themeStyles.gradient} text-white shadow-md ${themeStyles.shadowPill} transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>

            <div className="relative flex items-center justify-center my-3 w-full box-border">
              <div className="border-t border-slate-200 dark:border-white/10 w-full" />
              <span className="bg-slate-100 dark:bg-[#050913] px-2 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">or</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full max-w-full box-border min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      <div className="pt-4 pb-1 text-center text-xs text-slate-500 dark:text-slate-400 w-full box-border">
        <span>Don&apos;t have an account? </span>
        <Link href="/register" className={`font-bold min-h-[44px] inline-flex items-center ${themeStyles.textLink} hover:underline ml-1`}>
          Sign Up
        </Link>
      </div>

    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="2. Login"
      workflowSubtitle="Permanent Twin-Screen Working Workflow"
      currentUrlPath="/login"
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}
