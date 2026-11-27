'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  History,
  Loader2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Link2,
  QrCode,
  Smartphone,
  Mail,
  Contact,
  Share2,
  Copy,
  Ban,
  Clock,
  Eye,
  Edit3,
  Globe,
  RotateCcw,
  Users
} from 'lucide-react';
import {
  ShareEventType,
  ShareHistoryItem,
  ShareHistoryResponse
} from '@/types/sharing';
import { SHAREABLE_FIELD_MAP } from '@/lib/sharing/presets';

interface ShareHistoryTabProps {
  refreshSignal?: number;
  isAuthRequired?: boolean;
  onAuthRequired?: () => void;
  defaultProfileId?: string;
}

const EVENT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All activities' },
  { value: 'share_created', label: 'Link created' },
  { value: 'link_copied', label: 'Link copied' },
  { value: 'native_shared', label: 'Native share completed' },
  { value: 'qr_generated', label: 'QR generated' },
  { value: 'qr_opened', label: 'QR opened' },
  { value: 'nfc_shared', label: 'NFC written / tapped' },
  { value: 'nfc_opened', label: 'NFC opened' },
  { value: 'email_sent', label: 'Email sent' },
  { value: 'vcard_downloaded', label: 'vCard downloaded' },
  { value: 'link_opened', label: 'Link opened' },
  { value: 'access_updated', label: 'Permissions updated' },
  { value: 'link_expired', label: 'Link expired' },
  { value: 'link_revoked', label: 'Link revoked' }
];

const CHANNEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All channels' },
  { value: 'link', label: 'Link' },
  { value: 'qr', label: 'QR Code' },
  { value: 'nfc', label: 'NFC' },
  { value: 'native', label: 'Native Share' },
  { value: 'email', label: 'Email' },
  { value: 'vcard', label: 'vCard' }
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'public', label: 'Public URL' }
];

export function ShareHistoryTab({
  refreshSignal = 0,
  isAuthRequired = false,
  onAuthRequired
}: ShareHistoryTabProps) {
  const [items, setItems] = useState<ShareHistoryItem[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string; identifier: string }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  const [profileFilter, setProfileFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const onAuthRequiredRef = useRef(onAuthRequired);
  useEffect(() => {
    onAuthRequiredRef.current = onAuthRequired;
  }, [onAuthRequired]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHistory = useCallback(async () => {
    if (isAuthRequired) {
      setIsLoading(false);
      setErrorMsg('Your session has expired. Sign in again to view Share History.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (profileFilter !== 'all') params.set('profileId', profileFilter);
      if (eventTypeFilter !== 'all') params.set('eventType', eventTypeFilter);
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`/api/share/history?${params.toString()}`, { cache: 'no-store' });
      const data = (await res.json().catch(() => ({}))) as Partial<ShareHistoryResponse> & { error?: string };

      if (res.status === 401) {
        onAuthRequiredRef.current?.();
        throw new Error('Your session has expired. Please sign in again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load Share History.');
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setProfiles(Array.isArray(data.profiles) ? data.profiles : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 1);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load Share History.');
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthRequired,
    page,
    profileFilter,
    eventTypeFilter,
    channelFilter,
    statusFilter,
    fromDate,
    toDate,
    debouncedSearch
  ]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory, refreshSignal]);

  const hasActiveFilters =
    profileFilter !== 'all' ||
    eventTypeFilter !== 'all' ||
    channelFilter !== 'all' ||
    statusFilter !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setProfileFilter('all');
    setEventTypeFilter('all');
    setChannelFilter('all');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const formatExactDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const eventMeta = (type: ShareEventType) => {
    switch (type) {
      case 'share_created':
        return { label: 'Secure link created', icon: Link2, tone: 'bg-zinc-900 text-white dark:bg-white dark:text-black' };
      case 'link_copied':
        return { label: 'Link copied', icon: Copy, tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25' };
      case 'native_shared':
        return { label: 'Shared via device sheet', icon: Share2, tone: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25' };
      case 'qr_generated':
        return { label: 'QR code generated', icon: QrCode, tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/25' };
      case 'qr_opened':
        return { label: 'QR link opened', icon: QrCode, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25' };
      case 'nfc_shared':
        return { label: 'Shared via NFC', icon: Smartphone, tone: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25' };
      case 'nfc_opened':
        return { label: 'NFC link opened', icon: Smartphone, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25' };
      case 'email_sent':
        return { label: 'Sent by email', icon: Mail, tone: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25' };
      case 'vcard_downloaded':
        return { label: 'vCard exported', icon: Contact, tone: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700' };
      case 'link_opened':
        return { label: 'Link accessed', icon: Eye, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25' };
      case 'access_updated':
        return { label: 'Permissions updated', icon: Edit3, tone: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700' };
      case 'link_expired':
        return { label: 'Link expired', icon: Clock, tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25' };
      case 'link_revoked':
        return { label: 'Link revoked', icon: Ban, tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25' };
      default:
        return { label: type, icon: History, tone: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' };
    }
  };

  const statusBadgeClass = (status: ShareHistoryItem['accessStatus']) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
    if (status === 'expired') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
    if (status === 'revoked') return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25';
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  };

  return (
    <div data-testid="share-history-tab" className="flex flex-col">
      {/* Search + Quick Status + Expandable Filter Bar */}
      <div className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search profile, link, recipient, or channel..."
              aria-label="Search share history"
              className="w-full min-h-[40px] pl-10 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`min-h-[40px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Status Quick Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {STATUS_OPTIONS.map((st) => {
              const active = statusFilter === st.value;
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                      : 'bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-300'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {total} {total === 1 ? 'activity' : 'activities'} across all owned profiles
          </span>
        </div>

        {/* Expanded Filter Controls */}
        {showFilters && (
          <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Profile
              </label>
              <select
                aria-label="Filter by profile"
                value={profileFilter}
                onChange={(e) => {
                  setProfileFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              >
                <option value="all">All owned profiles</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (@{p.identifier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Activity Type
              </label>
              <select
                aria-label="Filter by activity type"
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Sharing Channel
              </label>
              <select
                aria-label="Filter by sharing channel"
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                aria-label="From date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                aria-label="To date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="w-full min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="px-4 sm:px-5 py-3.5 space-y-3">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading share activity history...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-7 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <History className="w-7 h-7 mx-auto text-zinc-400" />
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {hasActiveFilters ? 'No matching share activities' : 'No share history recorded yet'}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {hasActiveFilters
                ? 'Try clearing one or more filters or broadening your date range.'
                : 'When you create links, copy URLs, generate QR codes, tap via NFC, export vCards, or when visitors open your shared links, every activity across all your profiles will appear here.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black text-[11px] font-semibold cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const meta = eventMeta(item.eventType);
              const Icon = meta.icon;

              return (
                <article
                  key={item.id}
                  data-testid="share-history-item"
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-white/[0.03] p-3.5 sm:p-4 space-y-2.5 shadow-2xs"
                >
                  {/* Top Row: Activity Type + Exact Timestamp + Access Status */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.tone}`}>
                        <Icon className="w-3 h-3 shrink-0" />
                        <span>{meta.label}</span>
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold uppercase tracking-wide">
                        {item.channel}
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium capitalize">
                        {item.actorType === 'visitor' ? 'Visitor action' : item.actorType === 'system' ? 'System' : 'Owner'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${statusBadgeClass(
                          item.accessStatus
                        )}`}
                      >
                        {item.accessStatus === 'public' ? 'Public URL' : item.accessStatus}
                      </span>
                    </div>
                  </div>

                  {/* Profile & Associated Link Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-bold text-zinc-950 dark:text-white truncate">
                        {item.profileName}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        @{item.profileIdentifier}
                      </span>
                      {item.linkTitle ? (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">·</span>
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 truncate">
                            {item.linkTitle}
                          </span>
                          {item.tokenHint && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              ({item.tokenHint})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">·</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                            <Globe className="w-3 h-3" />
                            <span>Direct Public Profile</span>
                          </span>
                        </>
                      )}
                    </div>

                    <time
                      dateTime={item.timestamp}
                      className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0"
                    >
                      {formatExactDateTime(item.timestamp)}
                    </time>
                  </div>

                  {/* Metadata Grid: Shared Fields + Recipients + View Count + Last Accessed */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div>
                      Shared info:{' '}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.targetType === 'public_profile' && item.selectedFieldsCount === 0
                          ? 'Public profile fields'
                          : `${item.selectedFieldsCount} ${item.selectedFieldsCount === 1 ? 'field' : 'fields'}`}
                      </span>
                      {item.selectedFields.length > 0 && (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {' '}
                          (
                          {item.selectedFields
                            .slice(0, 3)
                            .map((k) => SHAREABLE_FIELD_MAP[k]?.label || (k.startsWith('custom-field-') ? 'Custom field' : k))
                            .join(', ')}
                          {item.selectedFields.length > 3 ? ` +${item.selectedFields.length - 3}` : ''})
                        </span>
                      )}
                    </div>

                    {item.viewCount !== null && (
                      <div>
                        Views:{' '}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.viewCount} {item.viewCount === 1 ? 'view' : 'views'}
                        </span>
                        {item.lastAccessedAt && (
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {' '}
                            · Last: {formatExactDateTime(item.lastAccessedAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {item.recipientNames.length > 0 && (
                      <div className="sm:col-span-2 flex items-center gap-1.5 flex-wrap pt-0.5">
                        <Users className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>Recipients:</span>
                        {item.recipientNames.map((name, idx) => (
                          <span
                            key={`${item.id}-rec-${idx}`}
                            className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-[10px]"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
