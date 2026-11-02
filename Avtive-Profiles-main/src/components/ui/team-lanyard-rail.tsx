'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Mail, 
  RotateCw, 
  Briefcase, 
  Building,
  Sparkles
} from 'lucide-react';
import { TeamMemberItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { cn } from '@/lib/utils';

export interface TeamLanyardRailProps {
  members?: TeamMemberItem[];
  theme?: ThemeConfig;
  companyName?: string;
  onSelectTeamMember?: (member: TeamMemberItem) => void;
  className?: string;
}

export function TeamLanyardRail({
  members = [],
  theme,
  companyName = 'Company',
  onSelectTeamMember,
  className = ''
}: TeamLanyardRailProps) {
  // If there are no team members, render strictly nothing
  const activeMembers = React.useMemo(() => {
    return Array.isArray(members)
      ? members.filter((m) => m && m.status !== 'REMOVED' && (m.name || m.role))
      : [];
  }, [members]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [swingAngles, setSwingAngles] = useState<Record<string, number>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; id: string } | null>(null);

  // Check for prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Autoplay functionality: rotates through team cards gently unless paused or reduced-motion is on
  useEffect(() => {
    if (activeMembers.length <= 1 || isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeMembers.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [activeMembers.length, isPaused, prefersReducedMotion]);

  // Flip toggle handler
  const handleToggleFlip = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setFlippedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, member: TeamMemberItem, index: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleFlip(member.id);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setCurrentIndex((prev) => (prev + 1) % activeMembers.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCurrentIndex((prev) => (prev - 1 + activeMembers.length) % activeMembers.length);
    }
  };

  // Pointer drag & swing physics
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (prefersReducedMotion) return;
    dragStartRef.current = { x: e.clientX, id };
    setIsPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (id: string, e: React.PointerEvent) => {
    if (!dragStartRef.current || dragStartRef.current.id !== id || prefersReducedMotion) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    // Map delta to angle bounded between -14 and 14 degrees
    const angle = Math.max(-14, Math.min(14, deltaX * 0.25));
    setSwingAngles((prev) => ({ ...prev, [id]: angle }));
  };

  const handlePointerUp = (id: string, e: React.PointerEvent) => {
    if (dragStartRef.current && dragStartRef.current.id === id) {
      dragStartRef.current = null;
      // Damped spring return back to 0
      setSwingAngles((prev) => ({ ...prev, [id]: 0 }));
      setIsPaused(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const scrollToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('[data-lanyard-card]');
      const targetCard = cards[index] as HTMLElement;
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [prefersReducedMotion]);

  if (activeMembers.length === 0) {
    return null;
  }

  return (
    <section 
      aria-label="Meet the Team Interactive Rail"
      className={cn(
        'w-full py-6 px-3 sm:px-6 relative overflow-hidden select-none',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900/5 dark:bg-white/10 flex items-center justify-center border border-black/5 dark:border-white/10">
            <Users className="w-4 h-4 text-slate-900 dark:text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Meet the Team
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive team badges · Drag to swing · Tap to flip
            </p>
          </div>
        </div>

        {/* Navigation controls */}
        {activeMembers.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollToIndex((currentIndex - 1 + activeMembers.length) % activeMembers.length)}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Previous team member"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 px-1">
              {currentIndex + 1} / {activeMembers.length}
            </span>
            <button
              type="button"
              onClick={() => scrollToIndex((currentIndex + 1) % activeMembers.length)}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Next team member"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Hanging Tension Rail Bar across top */}
      <div className="relative w-full mb-2">
        <div className="h-2 w-full bg-linear-to-r from-slate-300 via-slate-400 to-slate-300 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700 rounded-full shadow-inner border border-black/10 dark:border-white/10" />
        <div className="absolute top-1/2 -translate-y-1/2 left-2 w-3 h-3 rounded-full bg-slate-500 dark:bg-zinc-400 border border-white dark:border-zinc-800 shadow-xs" />
        <div className="absolute top-1/2 -translate-y-1/2 right-2 w-3 h-3 rounded-full bg-slate-500 dark:bg-zinc-400 border border-white dark:border-zinc-800 shadow-xs" />
      </div>

      {/* Horizontal Rail Container */}
      <div
        ref={containerRef}
        className="flex items-start gap-5 overflow-x-auto pb-4 pt-1 px-2 snap-x snap-mandatory scrollbar-none touch-pan-x"
        style={{ scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth' }}
      >
        {activeMembers.map((member, index) => {
          const isFlipped = Boolean(flippedIds[member.id]);
          const angle = swingAngles[member.id] || 0;
          const isActive = index === currentIndex;

          return (
            <div
              key={member.id}
              data-lanyard-card
              tabIndex={0}
              role="region"
              aria-label={`Badge for ${member.name}, ${member.role || 'Team Member'}`}
              onKeyDown={(e) => handleKeyDown(e, member, index)}
              className="shrink-0 flex flex-col items-center snap-center focus:outline-none group/lanyard"
              style={{ width: '260px' }}
            >
              {/* Lanyard Fabric Strap */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-3.5 h-8 bg-linear-to-b from-slate-800 to-slate-700 dark:from-zinc-600 dark:to-zinc-800 shadow-xs rounded-t-xs border-x border-black/20"
                  style={{
                    transformOrigin: 'top center',
                    transform: prefersReducedMotion ? 'none' : `rotate(${angle * 0.6}deg)`,
                    transition: angle === 0 ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
                  }}
                />
                {/* Metallic Clip & Carabiner Hook */}
                <div className="w-5 h-2.5 bg-linear-to-b from-slate-300 to-slate-400 dark:from-zinc-400 dark:to-zinc-600 rounded-sm shadow-xs border border-black/20 -mt-0.5 z-10" />
                <div className="w-2.5 h-3 border-2 border-slate-400 dark:border-zinc-400 rounded-full -mt-1 -mb-1 z-10" />
              </div>

              {/* ID Badge Card Container with 3D Flip & Swing */}
              <div
                onPointerDown={(e) => handlePointerDown(member.id, e)}
                onPointerMove={(e) => handlePointerMove(member.id, e)}
                onPointerUp={(e) => handlePointerUp(member.id, e)}
                onPointerCancel={(e) => handlePointerUp(member.id, e)}
                className="w-full relative cursor-grab active:cursor-grabbing touch-pan-y"
                style={{
                  perspective: '1000px',
                  transformOrigin: 'top center',
                  transform: prefersReducedMotion ? 'none' : `rotate(${angle}deg)`,
                  transition: angle === 0 ? 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'
                }}
              >
                {/* Top Slot Hole in Badge */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full border border-black/15 z-20" />

                {/* Card Flipper Inner */}
                <div
                  className={cn(
                    'w-full min-h-[340px] rounded-2xl border transition-all duration-500 relative shadow-md bg-white dark:bg-[#111319] border-slate-200 dark:border-white/10',
                    isActive ? 'ring-2 ring-slate-900/10 dark:ring-white/20 shadow-lg' : 'opacity-90 hover:opacity-100'
                  )}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped && !prefersReducedMotion ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: prefersReducedMotion ? 'opacity 0.2s' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {/* FRONT OF BADGE */}
                  <div
                    className={cn(
                      'absolute inset-0 p-5 flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111319]',
                      isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100 z-10'
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div>
                      {/* Company Barcode Strip / Header */}
                      <div className="pt-2 pb-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-zinc-500 uppercase font-semibold">
                          {companyName || 'TEAM PASS'}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-medium">
                          ID-{member.id.slice(-4).toUpperCase()}
                        </span>
                      </div>

                      {/* Photo and Identity */}
                      <div className="flex flex-col items-center text-center mt-4">
                        <div className="relative">
                          <img
                            src={member.avatar || '/images/default-avatar.png'}
                            alt={member.name}
                            onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-white/10 shadow-xs bg-slate-100 dark:bg-zinc-800"
                          />
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" title="Active Member" />
                        </div>

                        <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white truncate max-w-[210px]">
                          {member.name}
                        </h4>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[210px] mt-0.5">
                          {member.role || 'Team Member'}
                        </p>
                        {member.department && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{member.department}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footnotes */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFlip(member.id, e)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Flip info</span>
                      </button>

                      {member.profileId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTeamMember) {
                              onSelectTeamMember(member);
                            } else {
                              window.location.href = `/profile/${encodeURIComponent(member.profileId!)}`;
                            }
                          }}
                          className="text-[11px] font-semibold text-slate-900 dark:text-white flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BACK OF BADGE */}
                  <div
                    className={cn(
                      'absolute inset-0 p-5 flex flex-col justify-between rounded-2xl bg-slate-50 dark:bg-[#141720]',
                      !isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100 z-10'
                    )}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div>
                      {/* Magnetic stripe header motif */}
                      <div className="pt-2 pb-2">
                        <div className="h-6 w-full bg-slate-800 dark:bg-zinc-900 rounded-sm flex items-center px-2">
                          <span className="text-[9px] font-mono tracking-widest text-slate-400">
                            VERIFIED ACCESS
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                            Bio & Details
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1 line-clamp-4">
                            {member.bio || `${member.name} serves as ${member.role || 'a valued team member'} at ${companyName || 'the organization'}.`}
                          </p>
                        </div>

                        {/* Contact info respecting privacy */}
                        {member.email && (
                          <div className="pt-2 text-left">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                              Contact
                            </span>
                            <a
                              href={`mailto:${member.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 hover:underline truncate"
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Back Footer */}
                    <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFlip(member.id, e)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Flip back</span>
                      </button>

                      {member.profileId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTeamMember) {
                              onSelectTeamMember(member);
                            } else {
                              window.location.href = `/profile/${encodeURIComponent(member.profileId!)}`;
                            }
                          }}
                          className="text-[11px] font-semibold text-slate-900 dark:text-white flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          <span>Full Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
