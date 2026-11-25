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
  Loader2
} from 'lucide-react';
import { ShareRecipientAssociation } from '@/types/sharing';

interface RecipientPickerModalProps {
  contacts: ShareRecipientAssociation[];
  availableLabels: string[];
  selectedRecipients: ShareRecipientAssociation[];
  selectedEventLabel: string;
  isLoading: boolean;
  onSaveSelection: (recipients: ShareRecipientAssociation[], eventLabel: string) => void;
  onBack: () => void;
}

export function RecipientPickerModal({
  contacts,
  availableLabels,
  selectedRecipients,
  selectedEventLabel,
  isLoading,
  onSaveSelection,
  onBack
}: RecipientPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLabelFilter, setActiveLabelFilter] = useState<string>('All');
  const [draftSelected, setDraftSelected] = useState<ShareRecipientAssociation[]>(selectedRecipients);
  const [eventLabelDraft, setEventLabelDraft] = useState(selectedEventLabel);
  const [customLabelInput, setCustomLabelInput] = useState('');

  const filterChips = useMemo(() => {
    const base = ['All', ...availableLabels];
    return Array.from(new Set(base));
  }, [availableLabels]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (activeLabelFilter !== 'All') {
        const hasLabel = c.labels?.some((l) => l.toLowerCase() === activeLabelFilter.toLowerCase());
        if (!hasLabel) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.designation && c.designation.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.labels && c.labels.some((l) => l.toLowerCase().includes(q)))
      );
    });
  }, [contacts, activeLabelFilter, searchQuery]);

  const toggleRecipient = (contact: ShareRecipientAssociation) => {
    setDraftSelected((prev) => {
      const exists = prev.some((r) => r.id === contact.id);
      if (exists) return prev.filter((r) => r.id !== contact.id);
      return [...prev, contact];
    });
  };

  const handleApply = () => {
    const finalLabel = customLabelInput.trim() || eventLabelDraft;
    onSaveSelection(draftSelected, finalLabel);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sub-header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Back to Share"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
            Share with
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Associate saved connections or event context with this link
          </p>
        </div>
      </div>

      {/* Search & Label Filter */}
      <div className="px-4 sm:px-5 pt-3.5 pb-2.5 space-y-2.5 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, company, or label..."
            className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterChips.map((chip) => {
            const active = activeLabelFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveLabelFilter(chip)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Contact List & Event Label Picker */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-4">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading your Avtive connections...</span>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden bg-white dark:bg-white/[0.02]">
            {filteredContacts.map((contact) => {
              const isSelected = draftSelected.some((r) => r.id === contact.id);
              const initial = (contact.name || '?').trim().charAt(0).toUpperCase();
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggleRecipient(contact)}
                  className={`w-full p-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-900'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white/15 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {contact.name}
                      </div>
                      {(contact.designation || contact.company) && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 shrink-0 opacity-60" />
                          <span className="truncate">
                            {[contact.designation, contact.company].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                      {contact.labels && contact.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.labels.map((lbl) => (
                            <span
                              key={lbl}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium"
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                        : 'border-slate-300 dark:border-white/25'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-dashed border-slate-200 dark:border-white/15 text-center space-y-2 bg-slate-50/50 dark:bg-white/[0.02]">
            <Users className="w-7 h-7 mx-auto text-slate-400" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {contacts.length === 0 ? 'No saved connections yet' : 'No matching contacts'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              {contacts.length === 0
                ? 'Contacts appear here once you connect with people or exchange contact cards on Avtive. You can still attach an event label and generate a share link manually.'
                : 'Try adjusting your search or filter label.'}
            </p>
          </div>
        )}

        {/* Event / Recipient Context Label Section */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
              <span>Optional Event / Recipient Label</span>
            </label>
            {eventLabelDraft && (
              <button
                type="button"
                onClick={() => setEventLabelDraft('')}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableLabels.map((lbl) => {
              const isSelected = eventLabelDraft === lbl && !customLabelInput.trim();
              return (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => {
                    setCustomLabelInput('');
                    setEventLabelDraft((prev) => (prev === lbl ? '' : lbl));
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white font-semibold'
                      : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Plus className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customLabelInput}
              onChange={(e) => setCustomLabelInput(e.target.value)}
              placeholder="Or type custom label (e.g. Investor Meeting)"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>
        </div>
      </div>

      {/* Footer Done Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E131F] shrink-0 space-y-1.5">
        <button
          type="button"
          onClick={handleApply}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          {draftSelected.length > 0
            ? `Done · ${draftSelected.length} ${draftSelected.length === 1 ? 'person' : 'people'}`
            : 'Done'}
        </button>
        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
          You can also copy and share the generated link directly without selecting a contact.
        </p>
      </div>
    </div>
  );
}
