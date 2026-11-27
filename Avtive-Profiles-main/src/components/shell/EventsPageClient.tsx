'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ExternalLink, Loader2, Share2, Clock, Eye } from 'lucide-react';
import { ProfileData, UserSession } from '@/types/profile';
import { AvtivePlatformHeader } from '@/components/layout/AvtivePlatformHeader';
import { OwnerBottomNav } from '@/components/layout/OwnerBottomNav';

interface EventLinkSummary {
  id: string;
  profileId: string;
  profileName: string;
  eventLabel?: string;
  recipientName?: string;
  presetName?: string;
  status: string;
  viewCount: number;
  createdAt: string;
  lastAccessedAt?: string;
  shareUrl?: string;
}

interface EventsPageClientProps {
  profiles: ProfileData[];
  user: UserSession;
}

export function EventsPageClient({ profiles, user }: EventsPageClientProps) {
  const [links, setLinks] = useState<EventLinkSummary[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');

  const primaryProfile = profiles[0];
  const profileHref = primaryProfile
    ? `/profile/${primaryProfile.slug || primaryProfile.id}`
    : '/dashboard';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [linksResults, histRes] = await Promise.all([
          Promise.all(
            profiles.map(async (p) => {
              const res = await fetch(`/api/share/links?profileId=${encodeURIComponent(p.id)}`);
              if (!res.ok) return [];
              const json = await res.json();
              const rows = Array.isArray(json.links) ? json.links : [];
              return rows.map((row: any) => ({
                id: row.id,
                profileId: p.id,
                profileName: p.profileName || p.name,
                eventLabel: row.eventLabel || undefined,
                recipientName: row.recipientName || undefined,
                presetName: row.presetName || row.presetKey,
                status: row.status || 'active',
                viewCount: Number(row.viewCount || 0),
                createdAt: row.createdAt,
                lastAccessedAt: row.lastAccessedAt,
                shareUrl: row.shareUrl
              }));
            })
          ),
          fetch('/api/share/history?limit=1')
        ]);

        const histJson = histRes.ok ? await histRes.json() : { total: 0 };
        if (!cancelled) {
          setLinks(linksResults.flat());
          setHistoryCount(Number(histJson.total || 0));
        }
      } catch (err) {
        console.error('Failed to load event shares:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [profiles]);

  const eventNames = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => {
      if (l.eventLabel?.trim()) set.add(l.eventLabel.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [links]);

  const eventTaggedLinks = useMemo(() => {
    return links.filter((l) => {
      if (!l.eventLabel?.trim()) return false;
      if (selectedEventFilter !== 'all' && l.eventLabel.trim() !== selectedEventFilter) {
        return false;
      }
      return true;
    });
  }, [links, selectedEventFilter]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-24">
      <AvtivePlatformHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="avtive-serif-name text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
              Events & Campaigns
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Track cards shared at conferences, meetups, and networking events ({historyCount} total share events).
            </p>
          </div>
          {primaryProfile && (
            <Link
              href={`${profileHref}?share=true`}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7A1C33] hover:bg-[#64162A] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Create Event Link</span>
            </Link>
          )}
        </div>

        {eventNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedEventFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                selectedEventFilter === 'all'
                  ? 'bg-[#7A1C33] text-white border-[#7A1C33]'
                  : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              All Events ({eventNames.length})
            </button>
            {eventNames.map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => setSelectedEventFilter(ev)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                  selectedEventFilter === ev
                    ? 'bg-[#7A1C33] text-white border-[#7A1C33]'
                    : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="py-14 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading event shares...</span>
          </div>
        ) : eventTaggedLinks.length === 0 ? (
          <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-8 text-center space-y-3">
            <CalendarDays className="w-8 h-8 mx-auto text-[#B88746]" />
            <h2 className="text-base font-bold">No event-tagged share links yet</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Add an event label when sharing your card (e.g., &ldquo;Tech Summit 2026&rdquo;) to group links and follow up cleanly.
            </p>
            {primaryProfile && (
              <Link
                href={`${profileHref}?share=true`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1C33] text-white text-xs font-bold"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share with an Event Label</span>
              </Link>
            )}
          </section>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {eventTaggedLinks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B88746]/15 text-[#7A5926] dark:text-amber-300">
                      <CalendarDays className="w-3 h-3" />
                      {item.eventLabel}
                    </span>
                    <h3 className="text-sm font-bold mt-1.5 truncate">
                      {item.profileName}
                    </h3>
                    {item.recipientName && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                        Recipient: {item.recipientName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                      item.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : item.status === 'revoked'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {item.viewCount} {item.viewCount === 1 ? 'view' : 'views'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {item.shareUrl && (
                  <Link
                    href={`/profile/${item.profileId}?share=true`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A1C33] dark:text-amber-300 hover:underline pt-1"
                  >
                    <span>Manage in Share Workspace</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <OwnerBottomNav profileHref={profileHref} />
    </div>
  );
}
