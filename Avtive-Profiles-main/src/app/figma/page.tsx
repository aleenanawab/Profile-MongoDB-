'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  Copy, 
  QrCode, 
  Camera, 
  Eye, 
  EyeOff, 
  GripVertical, 
  ArrowLeft, 
  ExternalLink,
  Crown,
  User,
  Building2,
  Lock,
  Download
} from 'lucide-react';
import { GithubIcon, LinkedInIcon, TwitterXIcon } from '@/components/BrandIcons';

export default function FigmaShowcasePage() {
  const [activeToggleIndex, setActiveToggleIndex] = useState<{ [key: string]: boolean }>({
    photo: true,
    name: true,
    bio: true,
    skills: true,
    projects: true,
    educations: true,
    education: true,
    contact: false,
    social: true,
  });

  const toggleItem = (key: string) => {
    setActiveToggleIndex((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-8 font-sans transition-colors duration-200">
      
      {/* Figma Canvas Board Header */}
      <div className="max-w-[1700px] mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-500">
            Figma Design System Board
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Avtive Complete Platform UI Canvas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Complete 14-screen reference canvas matching the Figma board layout, font sizes, colors, and styling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="figma-pill-primary px-4 py-2 text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
          >
            <span>Live Register</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="/profile/syedmesumraza"
            className="figma-pill-secondary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <span>Live Profile</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1 OF FIGMA SCREENS                                                    */}
      {/* ========================================================================= */}
      <div className="max-w-[1700px] mx-auto mb-14">
        <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
          <span>Row 1 &middot; Onboarding &amp; Profile Setup Screens</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-5">
          
          {/* 1. Register / Signup */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                {/* 9:41 Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-5 font-mono">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-2 border border-current rounded-2xs inline-block" />
                  </div>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center justify-center pt-1 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm">
                      A
                    </div>
                    <span className="font-bold text-lg text-slate-900 dark:text-white">Avtive</span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Name</label>
                    <input type="text" readOnly value="Aleena Nawab" className="figma-input w-full px-3 py-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Email</label>
                    <input type="text" readOnly value="aleena@example.com" className="figma-input w-full px-3 py-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Password</label>
                    <input type="password" readOnly value="password123" className="figma-input w-full px-3 py-2 text-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Link href="/register" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Create Account
                </Link>
                <button type="button" className="figma-pill-secondary w-full py-2 text-[11px] font-medium flex items-center justify-center gap-2">
                  <span>Continue with Google</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 pt-1">
                  Already have an account? <span className="font-bold text-slate-900 dark:text-white">Log in</span>
                </p>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">1. Register / Signup</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Start with your account</p>
            </div>
          </div>

          {/* 2. Login */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-5 font-mono">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-2 border border-current rounded-2xs inline-block" />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-2 pb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm">
                      A
                    </div>
                    <span className="font-bold text-lg text-slate-900 dark:text-white">Avtive</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Email</label>
                    <input type="text" readOnly value="aleena@example.com" className="figma-input w-full px-3 py-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Password</label>
                    <input type="password" readOnly value="password123" className="figma-input w-full px-3 py-2 text-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Link href="/login" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Login
                </Link>
                <button type="button" className="figma-pill-secondary w-full py-2 text-[11px] font-medium flex items-center justify-center gap-2">
                  <span>Continue with Google</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 pt-1">
                  Already have an account? <span className="font-bold text-slate-900 dark:text-white">Log in</span>
                </p>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">2. Login</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">The secondary landing screen</p>
            </div>
          </div>

          {/* 3. Choose Theme */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-3 font-mono">
                  <span>9:41</span>
                  <span>2/3</span>
                </div>

                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Choose Theme</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Pick a style that matches your vibe.</p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl border border-amber-500/80 bg-amber-500/5 dark:bg-[#1B1E28] flex items-center gap-2.5">
                    <div className="w-10 h-8 rounded-lg bg-stone-100 border border-stone-200 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Editorial Minimal</div>
                      <div className="text-[9px] text-slate-500 dark:text-zinc-400">Clean &middot; Classy &middot; Professional</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center gap-2.5">
                    <div className="w-10 h-8 rounded-lg bg-black border border-emerald-500/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Developer Terminal</div>
                      <div className="text-[9px] text-slate-500 dark:text-zinc-400">Dark &middot; Geeky &middot; Precise</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center gap-2.5">
                    <div className="w-10 h-8 rounded-lg bg-[#180D15] border border-rose-500/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Luxe Velvet</div>
                      <div className="text-[9px] text-slate-500 dark:text-zinc-400">Dark &middot; Rich &middot; Premium</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/onboarding/theme" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Next
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">3. Choose Theme</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Select your preference aesthetic</p>
            </div>
          </div>

          {/* 4. Select Profile Type */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-3 font-mono">
                  <span>9:41</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>

                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Select Profile Type</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Select the type that matches for your profile.</p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-900 dark:border-white/30 bg-slate-50 dark:bg-[#1B1E28] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1E222D] flex items-center justify-center">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Owner</div>
                        <div className="text-[9px] text-slate-500 dark:text-zinc-400">Full control of the profile</div>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-[9px]">✓</div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E222D] flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Employee</div>
                        <div className="text-[9px] text-slate-500 dark:text-zinc-400">Work at a company</div>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-zinc-700" />
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E222D] flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Company</div>
                        <div className="text-[9px] text-slate-500 dark:text-zinc-400">Business / Organization</div>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-zinc-700" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/onboarding/role" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Next
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">4. Select Profile Type</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Fill in your information</p>
            </div>
          </div>

          {/* 5. Create Your Profile */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-0 min-h-[520px] flex flex-col justify-between text-left overflow-hidden">
              <div>
                {/* Banner */}
                <div className="relative h-24 w-full bg-slate-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-3 text-[10px] text-white font-mono">9:41</div>
                </div>

                {/* Avatar */}
                <div className="relative px-4 -mt-7 flex flex-col items-center">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop" alt="Avatar" className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-sm" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Aleena Nawab</h4>
                </div>

                <div className="p-4 space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" readOnly value="MERN Name" className="figma-input px-2 py-1.5 text-[11px]" />
                    <input type="text" readOnly value="Second Name" className="figma-input px-2 py-1.5 text-[11px]" />
                  </div>
                  <input type="text" readOnly value="Professional Title" className="figma-input w-full px-2 py-1.5 text-[11px]" />
                  <textarea rows={2} readOnly value="Bio text describing skills..." className="figma-input w-full px-2 py-1 text-[11px] resize-none" />
                </div>
              </div>

              <div className="p-4 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="figma-pill-secondary py-1.5 text-[11px]">Share</button>
                  <button type="button" className="figma-pill-primary py-1.5 text-[11px]">Connect</button>
                </div>
                <Link href="/onboarding/details" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Save Changes
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">5. Create Your Profile</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Users OWN profile dashboard</p>
            </div>
          </div>

          {/* 6. Edit Your Profile */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-0 min-h-[520px] flex flex-col justify-between text-left overflow-hidden">
              <div>
                <div className="relative h-24 w-full bg-slate-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-3 text-[10px] text-white font-mono">9:41</div>
                </div>

                <div className="relative px-4 -mt-7 flex flex-col items-center">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop" alt="Avatar" className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-sm" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Aleena Nawab</h4>
                </div>

                <div className="p-4 space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" readOnly value="Full Name" className="figma-input px-2 py-1.5 text-[11px]" />
                    <input type="text" readOnly value="Second Name" className="figma-input px-2 py-1.5 text-[11px]" />
                  </div>
                  <input type="text" readOnly value="Senior Systems Architect" className="figma-input w-full px-2 py-1.5 text-[11px]" />
                  <textarea rows={2} readOnly value="Passionate professional building modern digital identity systems." className="figma-input w-full px-2 py-1 text-[11px] resize-none" />
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link href="/profile/edit" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Save Changes
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">6. Edit Your Profile</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Use OWN profile editing dashboard</p>
            </div>
          </div>

          {/* 7. Choose Role to Share */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-3 font-mono">
                  <span>9:41</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>

                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Select Profile Type</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Choose the type that best fits your profile.</p>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-slate-900 dark:border-white/30 bg-slate-50 dark:bg-[#1B1E28] flex items-center justify-between">
                    <span className="text-xs font-bold">Owner</span>
                    <span className="text-[10px] text-emerald-500 font-bold">Active</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-between text-slate-500">
                    <span className="text-xs">Employee</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-between text-slate-500">
                    <span className="text-xs">Company</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">Themes</span>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-between">
                    <span className="text-xs">Cyber Theme</span>
                    <span>&gt;</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/profile/syedmesumraza/share" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Save Changes
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">6. Choose Role to Share</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Unlock your profile anytime</p>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2 OF FIGMA SCREENS                                                    */}
      {/* ========================================================================= */}
      <div className="max-w-[1700px] mx-auto mb-14">
        <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
          <span>Row 2 &middot; Privacy Limits, Reordering &amp; Live Public Profiles</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-5">
          
          {/* 8. Limitation Page */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-2 font-mono">
                  <span>9:41</span>
                  <span>✎</span>
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">What do you want to show?</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Customize the information to make private:</p>
                </div>

                <div className="space-y-2 divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {Object.entries(activeToggleIndex).map(([k, val]) => (
                    <div key={k} className="pt-1.5 flex items-center justify-between">
                      <span className="capitalize text-[11px]">{k === 'photo' ? 'Profile Photo' : k === 'name' ? 'Name & Title' : k === 'contact' ? 'Contact Info' : k === 'social' ? 'Social Links' : k}</span>
                      <button
                        type="button"
                        onClick={() => toggleItem(k)}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${val ? 'bg-[#10B981]' : 'bg-slate-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${val ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <Link href="/profile/syedmesumraza/share" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Next
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">8. Limitation Page</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Select what to show / hide</p>
            </div>
          </div>

          {/* 9. Drag & Drop Hider */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-2 font-mono">
                  <span>9:41</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Reorder Sections</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Drag to rearrange sections.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Visible Sections</div>
                  {['Profile', 'Skills', 'Projects', 'Experience', 'Education'].map((item) => (
                    <div key={item} className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151821] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3 h-3 text-slate-400" />
                        <span>{item}</span>
                      </div>
                      <EyeOff className="w-3 h-3 text-slate-400" />
                    </div>
                  ))}
                  <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 pt-1">Hidden Sections</div>
                  {['Contact Information', 'Social Links'].map((item) => (
                    <div key={item} className="p-1.5 rounded-lg border border-slate-200/60 dark:border-white/5 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{item}</span>
                      <Eye className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button type="button" className="figma-pill-secondary py-2 text-xs">Next</button>
                <Link href="/profile/syedmesumraza/share" className="figma-pill-primary py-2 text-xs font-bold block text-center">
                  Save
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">9. Drag &amp; Drop Hider</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Select order and view</p>
            </div>
          </div>

          {/* 10. Share Page */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-2 font-mono">
                  <span>9:41</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Share</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Your profile is ready to share!</p>
                </div>

                {/* Card Preview */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151821] border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Aleena Nawab</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">MERN Developer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] pt-1">
                    <GithubIcon className="w-3 h-3" />
                    <LinkedInIcon className="w-3 h-3" />
                    <TwitterXIcon className="w-3 h-3" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-3">
                  <label className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">Share Profile Link</label>
                  <div className="figma-input p-2 text-[10px] font-mono truncate">
                    https://avtive.profile/aleena-1m
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button type="button" className="figma-pill-secondary py-1.5 text-[10px] flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </button>
                  <button type="button" className="figma-pill-secondary py-1.5 text-[10px] flex items-center justify-center gap-1">
                    <QrCode className="w-3 h-3" />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <Link href="/profile/syedmesumraza" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Share
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">10. Share Page</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Share your profile link for QR</p>
            </div>
          </div>

          {/* 11. Public Profile (Right) */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-0 min-h-[520px] flex flex-col justify-between text-left overflow-hidden">
              <div>
                <div className="relative h-24 w-full bg-slate-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" alt="Banner" className="w-full h-full object-cover" />
                </div>
                <div className="relative px-4 -mt-7 flex flex-col items-center">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop" alt="Avatar" className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 pt-2">
                  <button type="button" className="figma-pill-secondary py-1 text-[10px]">Share</button>
                  <button type="button" className="figma-pill-primary py-1 text-[10px]">Connect</button>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <input type="text" readOnly value="Aleena Nawab" className="figma-input w-full px-2 py-1 text-[11px]" />
                  <input type="text" readOnly value="Professional Title" className="figma-input w-full px-2 py-1 text-[11px]" />
                  <div className="space-y-1 pt-1">
                    <div className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex justify-between text-[11px]">
                      <span>Skills</span>
                      <span>▾</span>
                    </div>
                    <div className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex justify-between text-[11px]">
                      <span>About</span>
                      <span>▾</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-0">
                <Link href="/profile/syedmesumraza" className="figma-pill-primary w-full py-2 text-xs font-bold block text-center">
                  Open Card
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">11. Public Profile</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Only shared info is visible</p>
            </div>
          </div>

          {/* 12. Public Profile (Dark) */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-0 min-h-[520px] flex flex-col justify-between text-left overflow-hidden bg-black text-white border-zinc-800">
              <div>
                <div className="relative h-24 w-full bg-zinc-950 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" alt="Banner" className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="relative px-4 -mt-7 flex flex-col items-center">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop" alt="Avatar" className="w-14 h-14 rounded-full border-2 border-zinc-800 object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 pt-2">
                  <button type="button" className="bg-zinc-800 text-white rounded-full py-1 text-[10px]">Share</button>
                  <button type="button" className="bg-white text-black rounded-full py-1 text-[10px] font-bold">Connect</button>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                    Which role profile you want to share?
                  </div>
                  <div className="space-y-1">
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[10px]">MERN Developer</div>
                    <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[10px]">HR Professional</div>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-0">
                <Link href="/profile/hamza-malik" className="bg-white text-black rounded-full w-full py-2 text-xs font-bold block text-center">
                  Employee Pass
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">12. Public Profile (Dark)</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Only shared info is visible</p>
            </div>
          </div>

          {/* 13. Choose Role to Share */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-3 font-mono">
                  <span>9:41</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Which role profile you want to share?</h3>
                </div>

                <div className="space-y-2">
                  {[
                    { title: 'MERN Developer', sub: 'Full control of the profile', active: true },
                    { title: 'HR Professional', sub: 'Work at a company', active: false },
                    { title: 'UI/UX Designer', sub: 'Business / Organization', active: false },
                    { title: 'Luxe Company', sub: 'Business / Organization', active: false }
                  ].map((role) => (
                    <div
                      key={role.title}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        role.active
                          ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-white/10'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{role.title}</div>
                        <div className="text-[9px] text-slate-500 dark:text-zinc-400">{role.sub}</div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border ${role.active ? 'bg-slate-900 dark:bg-white' : ''}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <Link href="/profile/avtive" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Next
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">13. Choose Role to Share</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Triggered view on mobile pass</p>
            </div>
          </div>

          {/* 7. Share with Privacy */}
          <div className="space-y-2">
            <div className="figma-phone-frame p-5 min-h-[520px] flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-2 font-mono">
                  <span>9:41</span>
                  <span>⚙</span>
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">What do you want to show?</h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">Customize the information you want to make private below:</p>
                </div>

                <div className="space-y-2 text-xs">
                  {['Profile Photo', 'Name & Title', 'Bio', 'Skills', 'Projects', 'Educations', 'Education', 'Social Links'].map((item) => (
                    <div key={item} className="flex items-center justify-between py-1">
                      <span className="text-[11px]">{item}</span>
                      <div className="w-7 h-3.5 rounded-full bg-[#10B981] p-0.5 flex justify-end">
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <Link href="/profile/syedmesumraza/share" className="figma-pill-primary w-full py-2.5 text-xs font-bold block text-center">
                  Next
                </Link>
              </div>
            </div>
            <div className="text-left px-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">7. Share with Privacy</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Generate glowing Share link</p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Slogan matching Figma Canvas */}
      <footer className="max-w-[1700px] mx-auto py-8 text-center border-t border-slate-200 dark:border-white/10">
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 tracking-wide font-mono">
          Avtive &middot; Build Your Professional Identity
        </p>
      </footer>

    </div>
  );
}
