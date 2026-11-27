'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Search, Tag, Mail, Calendar, ExternalLink, Loader2, Share2, UserCheck } from 'lucide-react';
import { ProfileData, UserConnection, UserSession } from '@/types/profile';
import { AvtivePlatformHeader } from '@/components/layout/AvtivePlatformHeader';
import { OwnerBottomNav } from '@/components/layout/OwnerBottomNav';

interface RecipientRow {
  id: string;
  recipientName: string;
  recipientEmail?: string;
  company?: string;
  eventLabel?: string;
  tags?: string[];
  lastSharedAt?: string;
  shareCount?: number;
}

interface ContactsPageClientProps {
  profiles: ProfileData[];
  user: UserSession;
}

export function ContactsPageClient({ profiles, user }: ContactsPageClientProps) {
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const primaryProfile = profiles[0];
  const profileHref = primaryProfile
    ? `/profile/${primaryProfile.slug || primaryProfile.id}`
    : '/dashboard';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [connRes, recRes] = await Promise.all([
          fetch('/api/profile/connect'),
          fetch('/api/share/recipients')
        ]);
        const connJson = connRes.ok ? await connRes.json() : { connections: [] };
        const recJson = recRes.ok ? await recRes.json() : { recipients: [] };

        if (!cancelled) {
          setConnections(Array.isArray(connJson.connections) ? connJson.connections : []);
          setRecipients(Array.isArray(recJson.recipients) ? recJson.recipients : []);
          const tags = Array.isArray(recJson.activeContactTags)
            ? recJson.activeContactTags.map((t: any) => (typeof t === 'string' ? t : t.name)).filter(Boolean)
            : [];
          setAvailableTags(tags);
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredConnections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return connections.filter((c) => {
      if (!q) return true;
      return (
        c.fromUserName?.toLowerCase().includes(q) ||
        c.fromUserEmail?.toLowerCase().includes(q) ||
        c.note?.toLowerCase().includes(q)
      );
    });
  }, [connections, searchQuery]);

  const filteredRecipients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipients.filter((r) => {
      if (selectedTag !== 'all' && !(r.tags || []).includes(selectedTag)) {
        return false;
      }
      if (!q) return true;
      return (
        r.recipientName?.toLowerCase().includes(q) ||
        r.recipientEmail?.toLowerCase().includes(q) ||
        r.company?.toLowerCase().includes(q) ||
        r.eventLabel?.toLowerCase().includes(q)
      );
    });
  }, [recipients, searchQuery, selectedTag]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-24">
      <AvtivePlatformHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="avtive-serif-name text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
              Contacts & Connections
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              People connected with your profiles and recipients you have shared cards with.
            </p>
          </div>
          {primaryProfile && (
            <Link
              href={`${profileHref}?share=true`}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#7A1C33] hover:bg-[#64162A] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Card</span>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts by name, email, company, or event..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1C33]/30"
            />
          </div>
          {availableTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              aria-label="Filter contacts by tag"
              className="h-11 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="py-14 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading contacts & connections...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Accepted Connections */}
            <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#7A1C33] dark:text-amber-300" />
                  <span>Network Connections</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {filteredConnections.length}
                  </span>
                </h2>
              </div>

              {filteredConnections.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3">
                  No accepted connections yet. When someone connects via your public card, they appear here.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3.5 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-[#FAF7F2]/60 dark:bg-zinc-950/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">
                          {conn.fromUserName || 'Avtive Member'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Connected
                        </span>
                      </div>
                      {conn.fromUserEmail && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{conn.fromUserEmail}</span>
                        </p>
                      )}
                      {conn.note && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {conn.note}
                        </p>
                      )}
                      {conn.toProfileId && (
                        <Link
                          href={`/profile/${conn.toProfileId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A1C33] dark:text-amber-300 hover:underline pt-1"
                        >
                          <span>View profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shared Contact Directory */}
            <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B88746]" />
                  <span>Shared Contact Directory</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {filteredRecipients.length}
                  </span>
                </h2>
              </div>

              {filteredRecipients.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3">
                  No recipients recorded yet. Assign a recipient when creating or emailing a share link.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredRecipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-[#FAF7F2]/60 dark:bg-zinc-950/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold truncate">{rec.recipientName}</span>
                        {typeof rec.shareCount === 'number' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {rec.shareCount} {rec.shareCount === 1 ? 'share' : 'shares'}
                          </span>
                        )}
                      </div>
                      {rec.recipientEmail && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                          {rec.recipientEmail}
                        </p>
                      )}
                      {rec.eventLabel && (
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{rec.eventLabel}</span>
                        </p>
                      )}
                      {Array.isArray(rec.tags) && rec.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rec.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#B88746]/15 text-[#7A5926] dark:text-amber-300"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <OwnerBottomNav profileHref={profileHref} />
    </div>
  );
}
