'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Ban,
  Edit3,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link2,
  Tag,
  AlertCircle,
  Lock
} from 'lucide-react';
import { ProfileData } from '@/types/profile';
import {
  ShareEventRecord,
  ShareExpiryOption,
  ShareLinkClientView,
  ShareLinkStatus
} from '@/types/sharing';
import {
  getFieldPrivacyTier,
  isFieldOwnerHidden,
  SHAREABLE_FIELD_MAP,
  SHAREABLE_FIELDS
} from '@/lib/sharing/presets';

interface SharedLinksTabProps {
  profile: ProfileData;
  allProfiles: ProfileData[];
  refreshSignal: number;
  isAuthRequired?: boolean;
  onAuthRequired?: () => void;
  onSelectLinkForQr?: (link: ShareLinkClientView) => void;
}

export function SharedLinksTab({
  profile,
  allProfiles,
  refreshSignal,
  isAuthRequired = false,
  onAuthRequired,
  onSelectLinkForQr
}: SharedLinksTabProps) {
  const [links, setLinks] = useState<ShareLinkClientView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const onAuthRequiredRef = React.useRef(onAuthRequired);
  React.useEffect(() => {
    onAuthRequiredRef.current = onAuthRequired;
  }, [onAuthRequired]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ShareLinkStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTitles, setShowTitles] = useState(true);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Expanded Details / Events State
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [eventsByLinkId, setEventsByLinkId] = useState<Record<string, ShareEventRecord[]>>({});
  const [loadingEventsId, setLoadingEventsId] = useState<string | null>(null);

  // Inline Edit Access State
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState('');
  const [editFieldsDraft, setEditFieldsDraft] = useState<string[]>([]);
  const [editExpiryDraft, setEditExpiryDraft] = useState<ShareExpiryOption>('never');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isAuthRequired) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setIsLoading(false);
        setErrorMsg('Your session has expired. Sign in again to view shared links.');
      });
      return () => {
        cancelled = true;
      };
    }
    Promise.resolve().then(() => {
      if (cancelled) return;
      setIsLoading(true);
      setErrorMsg(null);
    });
    fetch('/api/share/links')
      .then((res) =>
        res
          .json()
          .catch(() => ({}))
          .then((data) => ({ ok: res.ok, status: res.status, data }))
      )
      .then(({ ok, status, data }) => {
        if (cancelled) return;
        if (status === 401) {
          onAuthRequiredRef.current?.();
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (!ok) {
          throw new Error(data.error || 'Failed to load shared links.');
        }
        setLinks(Array.isArray(data.links) ? data.links : []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Could not load shared links.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshSignal, isAuthRequired]);

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (statusFilter !== 'all' && link.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        link.title.toLowerCase().includes(q) ||
        (link.eventLabel && link.eventLabel.toLowerCase().includes(q)) ||
        (link.profileName && link.profileName.toLowerCase().includes(q)) ||
        (link.templateName && link.templateName.toLowerCase().includes(q)) ||
        link.recipients.some(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.company && r.company.toLowerCase().includes(q))
        )
      );
    });
  }, [links, statusFilter, searchQuery]);

  const handleCopy = async (link: ShareLinkClientView) => {
    const url =
      link.shareUrl ||
      (typeof window !== 'undefined' ? `${window.location.origin}${link.sharePath}` : link.sharePath);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((prev) => (prev === link.id ? null : prev)), 2200);
    } catch {
      setErrorMsg('Clipboard access blocked.');
    }
  };

  const handleRevoke = async (linkId: string) => {
    setRevokingId(linkId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/share/links/${encodeURIComponent(linkId)}/revoke`, {
        method: 'POST'
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        throw new Error(data.error || 'Your session has expired. Please sign in again.');
      }
      if (!res.ok || !data.link) {
        throw new Error(data.error || 'Failed to revoke link.');
      }
      setLinks((prev) => prev.map((l) => (l.id === linkId ? data.link : l)));
      if (editingLinkId === linkId) setEditingLinkId(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Revoke failed.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleToggleDetails = async (linkId: string) => {
    if (expandedDetailsId === linkId) {
      setExpandedDetailsId(null);
      return;
    }
    setExpandedDetailsId(linkId);
    setLoadingEventsId(linkId);
    try {
      const res = await fetch(`/api/share/links/${encodeURIComponent(linkId)}`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        return;
      }
      if (res.ok && Array.isArray(data.events)) {
        setEventsByLinkId((prev) => ({ ...prev, [linkId]: data.events }));
      } else if (!res.ok) {
        setErrorMsg(data.error || 'Could not load activity history.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not load activity history.');
    } finally {
      setLoadingEventsId(null);
    }
  };

  const startEditLink = (link: ShareLinkClientView) => {
    setEditingLinkId(link.id);
    setEditTitleDraft(link.title);
    setEditFieldsDraft([...link.selectedFields]);
    setEditExpiryDraft(link.expiryOption);
  };

  const handleSaveEdit = async (link: ShareLinkClientView) => {
    setIsSavingEdit(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/share/links/${encodeURIComponent(link.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitleDraft,
          selectedFields: editFieldsDraft,
          expiryOption: editExpiryDraft
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        throw new Error(data.error || 'Your session has expired. Please sign in again.');
      }
      if (!res.ok || !data.link) {
        throw new Error(data.error || 'Failed to update share link.');
      }
      setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)));
      setEditingLinkId(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const statusBadge = (status: ShareLinkStatus) => {
    if (status === 'active') {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
    }
    if (status === 'expired') {
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
    }
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25';
  };

  const eventLabelText = (evType: ShareEventRecord['eventType']) => {
    switch (evType) {
      case 'share_created': return 'Share link created';
      case 'link_opened': return 'Link opened';
      case 'qr_opened': return 'QR code scanned / opened';
      case 'nfc_opened': return 'NFC link opened';
      case 'link_expired': return 'Link expired';
      case 'link_revoked': return 'Access revoked by owner';
      case 'access_updated': return 'Access settings updated';
      default: return evType;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Search & Filters Header */}
      <div className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, person, or event..."
            className="w-full min-h-[40px] pl-10 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(['all', 'active', 'expired', 'revoked'] as const).map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize border transition-all cursor-pointer shrink-0 ${active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowTitles((v) => !v)}
            className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer select-none"
          >
            <span>Show link titles</span>
            <span
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors inline-flex items-center ${showTitles ? 'bg-black dark:bg-white justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white dark:bg-black shadow-xs" />
            </span>
          </button>
        </div>
      </div>

      {/* Link Records */}
      <div className="px-4 sm:px-5 py-3.5 space-y-3">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading shared links...</span>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Link2 className="w-6 h-6 mx-auto text-zinc-400" />
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {links.length === 0 ? 'No share links yet' : 'No matching links'}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Create a share link in the Share tab to manage access, views, and expiry.
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => {
            const isCopied = copiedId === link.id;
            const isRevoking = revokingId === link.id;
            const isDetailsOpen = expandedDetailsId === link.id;
            const isEditingThis = editingLinkId === link.id;
            const associatedProfile =
              allProfiles.find((p) => p.id === link.profileId || p.slug === link.profileSlug) || profile;

            return (
              <div
                key={link.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-3.5 sm:p-4 space-y-3 shadow-2xs transition-colors"
              >
                {/* Top Title + Status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {showTitles ? link.title : `Link · ${link.tokenHint || 'Protected'}`}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {link.profileName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold">
                          {link.profileName}
                        </span>
                      )}
                      {link.recipients.map((r) => (
                        <span
                          key={r.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                        >
                          {r.name}
                        </span>
                      ))}
                      {link.eventLabel && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold inline-flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {link.eventLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border shrink-0 ${statusBadge(
                      link.status
                    )}`}
                  >
                    {link.status}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div>
                    Shared: <span className="text-slate-800 dark:text-slate-200 font-medium">{formatDate(link.createdAt)}</span>
                  </div>
                  <div>
                    Views: <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Opened {link.accessCount} {link.accessCount === 1 ? 'time' : 'times'}
                      {link.accessLimit ? ` / ${link.accessLimit}` : ''}
                    </span>
                  </div>
                  <div>
                    Expiry: <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {link.expiryOption === '1_view'
                        ? 'After 1 view'
                        : link.expiresAt
                          ? formatDate(link.expiresAt)
                          : 'Never'}
                    </span>
                  </div>
                  <div>
                    Last accessed: <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {link.lastAccessedAt ? formatDate(link.lastAccessedAt) : 'Not yet opened'}
                    </span>
                  </div>
                </div>

                {/* Access Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 mr-1">
                    {link.selectedFields.length} items:
                  </span>
                  {link.selectedFields.slice(0, 6).map((fKey) => (
                    <span
                      key={fKey}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium"
                    >
                      {SHAREABLE_FIELD_MAP[fKey]?.label || (fKey.startsWith('custom-field-') ? 'Custom Field' : fKey)}
                    </span>
                  ))}
                  {link.selectedFields.length > 6 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 font-semibold">
                      +{link.selectedFields.length - 6} more
                    </span>
                  )}
                </div>

                {/* Inline Edit Access Drawer */}
                {isEditingThis && !link.revoked && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                        Link Title
                      </label>
                      <input
                        type="text"
                        value={editTitleDraft}
                        onChange={(e) => setEditTitleDraft(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                        Expiry Rule
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['never', '7d', '1_view'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setEditExpiryDraft(opt)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${editExpiryDraft === opt
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                              }`}
                          >
                            {opt === 'never' ? 'Never' : opt === '7d' ? '7 days' : '1 view'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                        Authorized Standard Fields
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                        {SHAREABLE_FIELDS.filter((f) => {
                          const tier = getFieldPrivacyTier(associatedProfile, f.key);
                          return tier !== 'never_share' && !isFieldOwnerHidden(associatedProfile, f.key);
                        }).map((f) => {
                          const included = editFieldsDraft.includes(f.key);
                          const isPriv = getFieldPrivacyTier(associatedProfile, f.key) === 'private';
                          return (
                            <button
                              key={f.key}
                              type="button"
                              disabled={isPriv && !included}
                              onClick={() =>
                                setEditFieldsDraft((prev) =>
                                  prev.includes(f.key) ? prev.filter((k) => k !== f.key) : [...prev, f.key]
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${included
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
                                }`}
                            >
                              {isPriv && <Lock className="w-2.5 h-2.5 inline mr-1" />}
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingLinkId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={() => handleSaveEdit(link)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={link.status !== 'active' && !onSelectLinkForQr}
                    onClick={() => (onSelectLinkForQr && link.status === 'active' ? onSelectLinkForQr(link) : handleCopy(link))}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    title="Open QR & Sharing Options"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Share / QR</span>
                  </button>

                  <button
                    type="button"
                    disabled={link.status !== 'active'}
                    onClick={() => handleCopy(link)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={link.revoked}
                    onClick={() => (isEditingThis ? setEditingLinkId(null) : startEditLink(link))}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit access</span>
                  </button>

                  <button
                    type="button"
                    disabled={link.revoked || isRevoking}
                    onClick={() => handleRevoke(link.id)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {isRevoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                    <span>{link.revoked ? 'Revoked' : 'Revoke'}</span>
                  </button>
                </div>

                {/* History Details Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleDetails(link.id)}
                  className="w-full pt-1.5 border-t border-slate-100 dark:border-white/5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Activity History
                  </span>
                  {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isDetailsOpen && (
                  <div className="pt-1 space-y-1.5">
                    {loadingEventsId === link.id ? (
                      <div className="text-[11px] text-slate-400 py-2 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Loading events...</span>
                      </div>
                    ) : (eventsByLinkId[link.id] || []).length === 0 ? (
                      <p className="text-[11px] text-slate-400">No events recorded yet.</p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {(eventsByLinkId[link.id] || []).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between gap-2 text-[11px] py-1 px-2 rounded-lg bg-slate-50 dark:bg-white/[0.03]"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {eventLabelText(ev.eventType)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {formatDate(ev.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
