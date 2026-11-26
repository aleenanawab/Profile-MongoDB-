'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Search,
  Check,
  Users,
  Tag,
  Building2,
  Plus,
  Edit2,
  Loader2,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { ContactTagSummary, ShareRecipientAssociation } from '@/types/sharing';

export interface RecipientsRefreshPayload {
  recipients: ShareRecipientAssociation[];
  contactTags: ContactTagSummary[];
  activeContactTags: string[];
  eventLabels: string[];
}

interface RecipientPickerModalProps {
  contacts: ShareRecipientAssociation[];
  contactTags?: ContactTagSummary[];
  activeContactTags?: string[];
  eventLabels?: string[];
  /** @deprecated Kept for backward-compatible callers; activeContactTags takes precedence. */
  availableLabels?: string[];
  selectedRecipients: ShareRecipientAssociation[];
  selectedEventLabel: string;
  isLoading: boolean;
  onSaveSelection: (recipients: ShareRecipientAssociation[], eventLabel: string) => void;
  onContactsDataChange?: (payload: RecipientsRefreshPayload) => void;
  onAuthRequired?: () => void;
  onBack: () => void;
}

export function RecipientPickerModal({
  contacts,
  contactTags = [],
  activeContactTags,
  eventLabels = [],
  availableLabels,
  selectedRecipients,
  selectedEventLabel,
  isLoading,
  onSaveSelection,
  onContactsDataChange,
  onAuthRequired,
  onBack
}: RecipientPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('All');
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>(() =>
    selectedRecipients.map((r) => r.id)
  );
  const [eventLabelDraft, setEventLabelDraft] = useState(selectedEventLabel);

  // Persistent contact tag management state
  const [newTagName, setNewTagName] = useState('');
  const [isMutatingTags, setIsMutatingTags] = useState(false);
  const [editingTagsForContactId, setEditingTagsForContactId] = useState<string | null>(null);
  const [inlineNewTagByContact, setInlineNewTagByContact] = useState<Record<string, string>>({});
  const [renamingTagId, setRenamingTagId] = useState<string | null>(null);
  const [renameTagDraft, setRenameTagDraft] = useState('');
  const [tagFeedback, setTagFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Derive tag catalog cleanly from saved contactTags or assigned recipient tags
  const resolvedContactTags = useMemo<ContactTagSummary[]>(() => {
    if (contactTags.length > 0) return contactTags;
    const countMap = new Map<string, number>();
    for (const c of contacts) {
      const assigned = c.tags || c.labels || [];
      for (const t of assigned) {
        const clean = t.trim();
        if (clean) countMap.set(clean, (countMap.get(clean) || 0) + 1);
      }
    }
    return Array.from(countMap.entries()).map(([name, count]) => ({
      id: `tag-${name.toLowerCase()}`,
      name,
      count,
      createdAt: ''
    }));
  }, [contactTags, contacts]);

  // Filter bar shows ONLY tags actually assigned to >= 1 contact (no unused default labels)
  const resolvedActiveFilterTags = useMemo<string[]>(() => {
    if (Array.isArray(activeContactTags)) {
      const present = new Set<string>();
      for (const c of contacts) {
        for (const t of c.tags || c.labels || []) {
          present.add(t.toLowerCase());
        }
      }
      if (present.size > 0) {
        return activeContactTags.filter((t) => present.has(t.toLowerCase()));
      }
      return [];
    }
    if (resolvedContactTags.length > 0) {
      return resolvedContactTags.filter((t) => t.count > 0).map((t) => t.name);
    }
    return (availableLabels || []).filter((lbl) =>
      contacts.some((c) => (c.tags || c.labels || []).some((t) => t.toLowerCase() === lbl.toLowerCase()))
    );
  }, [activeContactTags, contacts, resolvedContactTags, availableLabels]);

  const effectiveTagFilter = useMemo(() => {
    if (
      activeTagFilter !== 'All' &&
      !resolvedActiveFilterTags.some((t) => t.toLowerCase() === activeTagFilter.toLowerCase())
    ) {
      return 'All';
    }
    return activeTagFilter;
  }, [activeTagFilter, resolvedActiveFilterTags]);

  const filterChips = useMemo(
    () => ['All', ...Array.from(new Set(resolvedActiveFilterTags))],
    [resolvedActiveFilterTags]
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const cTags = c.tags || c.labels || [];
      if (effectiveTagFilter !== 'All') {
        const hasTag = cTags.some((t) => t.toLowerCase() === effectiveTagFilter.toLowerCase());
        if (!hasTag) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.designation && c.designation.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        cTags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, effectiveTagFilter, searchQuery]);

  const selectedContacts = useMemo(() => {
    const byId = new Map(contacts.map((c) => [c.id, c]));
    return draftSelectedIds
      .map((id) => byId.get(id) || selectedRecipients.find((r) => r.id === id))
      .filter((r): r is ShareRecipientAssociation => Boolean(r));
  }, [contacts, draftSelectedIds, selectedRecipients]);

  const toggleRecipient = (contact: ShareRecipientAssociation) => {
    setDraftSelectedIds((prev) =>
      prev.includes(contact.id) ? prev.filter((id) => id !== contact.id) : [...prev, contact.id]
    );
  };

  const applyApiPayload = (data: {
    recipients?: ShareRecipientAssociation[];
    contactTags?: ContactTagSummary[];
    activeContactTags?: string[];
    availableLabels?: string[];
    eventLabels?: string[];
  }) => {
    onContactsDataChange?.({
      recipients: Array.isArray(data.recipients) ? data.recipients : contacts,
      contactTags: Array.isArray(data.contactTags) ? data.contactTags : resolvedContactTags,
      activeContactTags: Array.isArray(data.activeContactTags)
        ? data.activeContactTags
        : Array.isArray(data.availableLabels)
          ? data.availableLabels
          : [],
      eventLabels: Array.isArray(data.eventLabels) ? data.eventLabels : eventLabels
    });
  };

  const handleCreateTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagName.trim();
    if (!clean) return;
    setIsMutatingTags(true);
    setTagFeedback(null);
    try {
      const res = await fetch('/api/share/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clean,
          recipientIds: draftSelectedIds
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        throw new Error(data.error || 'Session expired. Please sign in again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create contact tag.');
      }
      applyApiPayload(data);
      setNewTagName('');
      setTagFeedback({
        type: 'success',
        text:
          draftSelectedIds.length > 0
            ? `Created "${clean}" and tagged ${draftSelectedIds.length} selected contact(s).`
            : `Tag "${clean}" created.`
      });
    } catch (err: unknown) {
      setTagFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not create tag.'
      });
    } finally {
      setIsMutatingTags(false);
    }
  };

  const handleAssignOrRemoveTag = async (
    recipientIds: string[],
    tagName: string,
    mode: 'add' | 'remove'
  ) => {
    if (recipientIds.length === 0 || !tagName.trim()) return;
    setIsMutatingTags(true);
    setTagFeedback(null);
    try {
      const res = await fetch('/api/share/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds,
          ...(mode === 'add' ? { addTags: [tagName] } : { removeTags: [tagName] })
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        throw new Error(data.error || 'Session expired. Please sign in again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update contact tag.');
      }
      applyApiPayload(data);
      setTagFeedback({
        type: 'success',
        text:
          mode === 'add'
            ? `Added "${tagName}" to ${recipientIds.length} contact(s).`
            : `Removed "${tagName}".`
      });
    } catch (err: unknown) {
      setTagFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update contact tags.'
      });
    } finally {
      setIsMutatingTags(false);
    }
  };

  const handleDeleteTag = async (tag: ContactTagSummary) => {
    setIsMutatingTags(true);
    setTagFeedback(null);
    try {
      const res = await fetch('/api/share/recipients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id, tagName: tag.name })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        throw new Error(data.error || 'Session expired. Please sign in again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete tag.');
      }
      applyApiPayload(data);
      if (activeTagFilter.toLowerCase() === tag.name.toLowerCase()) {
        setActiveTagFilter('All');
      }
      setTagFeedback({ type: 'success', text: `Deleted tag "${tag.name}".` });
    } catch (err: unknown) {
      setTagFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete tag.'
      });
    } finally {
      setIsMutatingTags(false);
    }
  };

  const handleRenameTag = async (tag: ContactTagSummary) => {
    const cleanNext = renameTagDraft.trim();
    if (!cleanNext || cleanNext === tag.name) {
      setRenamingTagId(null);
      setRenameTagDraft('');
      return;
    }
    setIsMutatingTags(true);
    setTagFeedback(null);
    try {
      const res = await fetch('/api/share/recipients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id, tagName: tag.name, newName: cleanNext })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onAuthRequired?.();
        throw new Error(data.error || 'Session expired. Please sign in again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename tag.');
      }
      applyApiPayload(data);
      if (activeTagFilter.toLowerCase() === tag.name.toLowerCase()) {
        setActiveTagFilter(cleanNext);
      }
      setRenamingTagId(null);
      setRenameTagDraft('');
      setTagFeedback({ type: 'success', text: `Renamed tag "${tag.name}" to "${cleanNext}".` });
    } catch (err: unknown) {
      setTagFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to rename tag.'
      });
    } finally {
      setIsMutatingTags(false);
    }
  };

  const handleApply = () => {
    onSaveSelection(selectedContacts, eventLabelDraft.trim());
  };

  return (
    <div className="flex flex-col" data-testid="recipient-picker-panel">
      {/* Sub-header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          aria-label="Back to Share"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white truncate">
            Share with
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Select contacts, organize with tags, or attach an event label
          </p>
        </div>
      </div>

      {/* Search & Active Tag Filters (only shows tags with >= 1 contact) */}
      <div className="px-4 sm:px-5 pt-3.5 pb-3 space-y-2.5 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, company, or tag..."
            className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none" role="tablist" aria-label="Filter contacts by tag">
          {filterChips.map((chip) => {
            const active = effectiveTagFilter === chip;
            const summary = resolvedContactTags.find((t) => t.name.toLowerCase() === chip.toLowerCase());
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveTagFilter(chip)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer border inline-flex items-center gap-1 ${active
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
              >
                <span>{chip}</span>
                {chip !== 'All' && summary && summary.count > 0 && (
                  <span className="opacity-70 text-[10px] font-mono">{summary.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact Tags Management & Contact List */}
      <div className="px-4 sm:px-5 py-4 space-y-4">
        {tagFeedback && (
          <div
            role="status"
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 ${tagFeedback.type === 'success'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
              }`}
          >
            <span className="flex items-center gap-1.5">
              {tagFeedback.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {tagFeedback.text}
            </span>
            <button
              type="button"
              onClick={() => setTagFeedback(null)}
              className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
              aria-label="Dismiss tag notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Persistent Contact Tags Manager (Batch & Owner Catalog) */}
        <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Contact Tags</span>
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {draftSelectedIds.length > 0
                ? `Tap a tag to apply to ${draftSelectedIds.length} selected`
                : 'Create tags or select contacts below'}
            </span>
          </div>

          <form onSubmit={handleCreateTag} className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Create tag (e.g. Recruiters, Clients)..."
              aria-label="New contact tag"
              maxLength={40}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20"
            />
            <button
              type="submit"
              disabled={isMutatingTags || !newTagName.trim()}
              className="min-h-[34px] px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-45"
            >
              {isMutatingTags ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Add tag</span>
            </button>
          </form>

          {resolvedContactTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {resolvedContactTags.map((tag) => {
                const tagKey = tag.id || tag.name;
                const isRenaming = renamingTagId === tagKey;
                const allSelectedHaveTag =
                  draftSelectedIds.length > 0 &&
                  selectedContacts.every((c) =>
                    (c.tags || c.labels || []).some((t) => t.toLowerCase() === tag.name.toLowerCase())
                  );
                if (isRenaming) {
                  return (
                    <div
                      key={tagKey}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-950"
                    >
                      <input
                        type="text"
                        value={renameTagDraft}
                        onChange={(e) => setRenameTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameTag(tag);
                          } else if (e.key === 'Escape') {
                            setRenamingTagId(null);
                            setRenameTagDraft('');
                          }
                        }}
                        aria-label={`Rename tag ${tag.name}`}
                        maxLength={40}
                        className="w-24 bg-transparent text-[11px] font-medium text-zinc-950 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={isMutatingTags}
                        onClick={() => handleRenameTag(tag)}
                        aria-label={`Save renamed tag ${tag.name}`}
                        className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingTagId(null);
                          setRenameTagDraft('');
                        }}
                        aria-label={`Cancel rename ${tag.name}`}
                        className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={tagKey}
                    className={`inline-flex items-center rounded-full border text-[11px] font-medium transition-colors ${allSelectedHaveTag
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
                      }`}
                  >
                    <button
                      type="button"
                      disabled={isMutatingTags}
                      onClick={() => {
                        if (draftSelectedIds.length > 0) {
                          handleAssignOrRemoveTag(
                            draftSelectedIds,
                            tag.name,
                            allSelectedHaveTag ? 'remove' : 'add'
                          );
                        } else if (tag.count > 0) {
                          setActiveTagFilter((prev) => (prev === tag.name ? 'All' : tag.name));
                        } else {
                          setTagFeedback({
                            type: 'error',
                            text: `Select one or more contacts below first, then tap "${tag.name}" to apply it.`
                          });
                        }
                      }}
                      title={
                        draftSelectedIds.length > 0
                          ? allSelectedHaveTag
                            ? `Remove "${tag.name}" from ${draftSelectedIds.length} selected`
                            : `Apply "${tag.name}" to ${draftSelectedIds.length} selected`
                          : tag.count > 0
                            ? `Filter by ${tag.name}`
                            : `Select contacts below to assign "${tag.name}"`
                      }
                      className="pl-2.5 pr-1 py-1 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {draftSelectedIds.length > 0 && allSelectedHaveTag && <Check className="w-3 h-3" />}
                      <span>{tag.name}</span>
                      <span className="text-[10px] opacity-65 font-mono">{tag.count}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isMutatingTags}
                      onClick={() => {
                        setRenamingTagId(tagKey);
                        setRenameTagDraft(tag.name);
                      }}
                      aria-label={`Edit tag ${tag.name}`}
                      title={`Rename tag ${tag.name}`}
                      className="px-1 py-1 opacity-60 hover:opacity-100 cursor-pointer disabled:opacity-40"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isMutatingTags}
                      onClick={() => handleDeleteTag(tag)}
                      aria-label={`Delete tag ${tag.name}`}
                      title={`Delete tag ${tag.name}`}
                      className="pr-2 pl-0.5 py-1 opacity-60 hover:opacity-100 cursor-pointer disabled:opacity-40"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact Rows */}
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading contacts...</span>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200/80 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
            {filteredContacts.map((contact) => {
              const isSelected = draftSelectedIds.includes(contact.id);
              const initial = (contact.name || '?').trim().charAt(0).toUpperCase();
              const contactTagList = contact.tags || contact.labels || [];
              const isTagEditorOpen = editingTagsForContactId === contact.id;
              const inlineTagDraft = inlineNewTagByContact[contact.id] || '';
              const unassignedTags = resolvedContactTags.filter(
                (t) => !contactTagList.some((ct) => ct.toLowerCase() === t.name.toLowerCase())
              );

              return (
                <div
                  key={contact.id}
                  className={`p-3 transition-colors ${isSelected ? 'bg-zinc-100/90 dark:bg-zinc-900' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleRecipient(contact)}
                      aria-label={`Select ${contact.name}`}
                      className="flex-1 min-w-0 flex items-start gap-3 text-left cursor-pointer"
                    >
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                          {contact.name}
                        </div>
                        {(contact.designation || contact.company) && (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 shrink-0 opacity-60" />
                            <span className="truncate">
                              {[contact.designation, contact.company].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTagsForContactId((prev) => (prev === contact.id ? null : contact.id))
                        }
                        aria-label={`Manage tags for ${contact.name}`}
                        className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 cursor-pointer flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>+ Tag</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRecipient(contact)}
                        aria-label={isSelected ? `Deselect ${contact.name}` : `Select ${contact.name}`}
                        aria-pressed={isSelected}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${isSelected
                          ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                          }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>
                  </div>

                  {/* Assigned Contact Tags */}
                  {contactTagList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-[52px]">
                      {contactTagList.map((tagName) => (
                        <span
                          key={tagName}
                          className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full bg-zinc-200/75 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-semibold"
                        >
                          <span>{tagName}</span>
                          <button
                            type="button"
                            disabled={isMutatingTags}
                            onClick={() => handleAssignOrRemoveTag([contact.id], tagName, 'remove')}
                            aria-label={`Remove tag ${tagName} from ${contact.name}`}
                            className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Per-Contact Inline Tag Picker */}
                  {isTagEditorOpen && (
                    <div className="mt-2.5 ml-[52px] p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
                      {unassignedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {unassignedTags.map((t) => (
                            <button
                              key={t.id || t.name}
                              type="button"
                              disabled={isMutatingTags}
                              onClick={() => handleAssignOrRemoveTag([contact.id], t.name, 'add')}
                              className="px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-[10px] font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-white cursor-pointer inline-flex items-center gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{t.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={inlineTagDraft}
                          onChange={(e) =>
                            setInlineNewTagByContact((prev) => ({
                              ...prev,
                              [contact.id]: e.target.value
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && inlineTagDraft.trim()) {
                              e.preventDefault();
                              const tagToAdd = inlineTagDraft.trim();
                              setInlineNewTagByContact((prev) => ({ ...prev, [contact.id]: '' }));
                              handleAssignOrRemoveTag([contact.id], tagToAdd, 'add');
                            }
                          }}
                          placeholder={`Add tag to ${contact.name}...`}
                          aria-label={`Assign new tag to ${contact.name}`}
                          className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isMutatingTags || !inlineTagDraft.trim()}
                          onClick={() => {
                            const tagToAdd = inlineTagDraft.trim();
                            if (!tagToAdd) return;
                            setInlineNewTagByContact((prev) => ({ ...prev, [contact.id]: '' }));
                            handleAssignOrRemoveTag([contact.id], tagToAdd, 'add');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black dark:bg-white text-white dark:text-black text-[10px] font-semibold cursor-pointer disabled:opacity-45"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Users className="w-6 h-6 mx-auto text-zinc-400" />
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {contacts.length === 0 ? 'No saved contacts yet' : 'No matching contacts'}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              {contacts.length === 0
                ? 'Contacts appear here once you connect with someone. You can still share this link directly.'
                : 'Try adjusting your search or tag filter.'}
            </p>
          </div>
        )}

        {/* Separated Share Event Label (Per-link context, never mixed with Contact Tags) */}
        <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <label
                htmlFor="share-event-label-input"
                className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Share Event Label (Optional)</span>
              </label>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Applies to this link only — separate from contact tags
              </p>
            </div>
            {eventLabelDraft && (
              <button
                type="button"
                onClick={() => setEventLabelDraft('')}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <input
            id="share-event-label-input"
            type="text"
            value={eventLabelDraft}
            onChange={(e) => setEventLabelDraft(e.target.value)}
            placeholder="e.g. Expo 2027, Investor Meeting"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20"
          />

          {eventLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {eventLabels.map((evLbl) => {
                const active = eventLabelDraft === evLbl;
                return (
                  <button
                    key={evLbl}
                    type="button"
                    onClick={() => setEventLabelDraft((prev) => (prev === evLbl ? '' : evLbl))}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${active
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                  >
                    {evLbl}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Done Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] shrink-0">
        <button
          type="button"
          onClick={handleApply}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          {draftSelectedIds.length > 0
            ? `Done · ${draftSelectedIds.length} ${draftSelectedIds.length === 1 ? 'person' : 'people'}`
            : 'Done'}
        </button>
      </div>
    </div>
  );
}
