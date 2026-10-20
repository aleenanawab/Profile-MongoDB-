'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sun, Moon, LogIn, UserPlus, LogOut, LayoutGrid, Edit3 } from 'lucide-react';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { UserSession, ProfileData } from '@/types/profile';

export function AvtivePlatformHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleDarkMode } = usePortfolioTheme();

  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setProfile(data.profile || null);
        setProfiles(data.profiles || []);
      } else {
        setUser(null);
        setProfile(null);
        setProfiles([]);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setProfiles([]);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      if (user?.email) {
        localStorage.setItem('avtive_remembered_identifier', user.email);
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      try {
        sessionStorage.removeItem('avtive_active_session');
      } catch {}
      setUser(null);
      setProfile(null);
      setProfiles([]);
      window.location.replace('/login');
    }
  };

  const primarySlug = profiles?.[0]?.slug || profiles?.[0]?.id || profile?.slug || profile?.id || user?.id;
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <header className="sticky top-0 z-50 w-full transition-colors duration-200 border-b bg-white/95 text-slate-900 border-slate-200 shadow-xs dark:bg-[#0B0D13]/95 dark:text-white dark:border-white/10 dark:shadow-none backdrop-blur-md">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        
        {/* Left Section: Brand Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 group hover:opacity-95 transition-opacity"
          aria-label="Avtive Home"
        >
          {/* Stylized Circle "A" Icon */}
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform font-sans">
            A
          </div>
          
          <span className="font-bold text-base sm:text-lg tracking-tight font-sans text-slate-900 dark:text-white">
            Avtive
          </span>
        </Link>

        {/* Right Section: Auth Navigation + Light / Dark Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isLoadingAuth && (
            <>
              {user ? (
                /* Authenticated State Actions */
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {primarySlug && (
                    <Link
                      href={`/profile/${encodeURIComponent(primarySlug)}?edit=true`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                        pathname?.includes('/edit') || (typeof window !== 'undefined' && window.location.search.includes('edit=true'))
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white'
                          : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 dark:bg-[#161821] dark:hover:bg-[#1f222e] dark:text-white dark:border-white/15'
                      }`}
                      title="Open Profile Editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                      pathname === '/dashboard'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white'
                        : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 dark:bg-[#161821] dark:hover:bg-[#1f222e] dark:text-white dark:border-white/15'
                    }`}
                    title="Workspaces Dashboard"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Profiles</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 border border-transparent transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                /* Unauthenticated State Actions */
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {pathname !== '/login' && (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs bg-white hover:bg-slate-100 text-slate-900 border-slate-300 dark:bg-[#161821] dark:hover:bg-[#1f222e] dark:text-white dark:border-white/15"
                      title="Log In to your existing account"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Log In</span>
                    </Link>
                  )}

                  {pathname !== '/register' && (
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-2xs"
                      title="Create a new account"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign Up</span>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle Light / Dark Mode"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs bg-white hover:bg-slate-100 text-slate-900 border-slate-300 dark:bg-[#161821] dark:hover:bg-[#1f222e] dark:text-white dark:border-white/15 active:scale-95"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700 fill-slate-700" />
                <span className="hidden sm:inline text-[11px] font-medium">Dark</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}

