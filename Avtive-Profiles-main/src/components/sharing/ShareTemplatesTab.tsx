'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Check,
  Copy,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  QrCode,
  FileDown,
  Lock,
  Eye
} from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { ShareTemplateRecord } from '@/types/sharing';
import {
  BUILT_IN_TEMPLATES,
  filterAuthorizedSelection,
  SHAREABLE_FIELD_MAP,
  SHAREABLE_FIELDS
} from '@/lib/sharing/presets';

interface ShareTemplatesTabProps {
  profile: ProfileData;
  activeTemplateId?: string;
  currentSelectedFields: string[];
  onApplyTemplate: (template: ShareTemplateRecord) => void;
  onQuickQrAction: () => void;
  onQuickDownloadCardPdf: () => void;
}

export function ShareTemplatesTab({
  profile,
  activeTemplateId,
  currentSelectedFields,
  onApplyTemplate,
  onQuickQrAction,
  onQuickDownloadCardPdf
}: ShareTemplatesTabProps) {
  const [templates, setTemplates] = useState<ShareTemplateRecord[]>(BUILT_IN_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Create custom template form
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rename / Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFields, setEditFields] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setIsLoading(true);
    });
    fetch('/api/share/templates')
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!cancelled && ok && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      })
      .catch(() => {
        // Keep built-ins gracefully
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const safeSelection = filterAuthorizedSelection(profile, currentSelectedFields, {
        allowConfirmedPrivate: false
      }).authorizedFields;

      const res = await fetch('/api/share/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          selectedFields: safeSelection,
          profileId: profile.id
        })
      });
      const data = await res.json();
      if (!res.ok || !data.template) {
        throw new Error(data.error || 'Failed to save template.');
      }
      setTemplates((prev) => [...prev, data.template]);
      setNewName('');
      setNewDesc('');
      setIsCreating(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (templateId: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/share/templates/${encodeURIComponent(templateId)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok || !data.template) {
        throw new Error(data.error || 'Failed to duplicate template.');
      }
      setTemplates((prev) => [...prev, data.template]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Duplicate failed.');
    }
  };

  const handleStartEdit = (tpl: ShareTemplateRecord) => {
    setEditingId(tpl.id);
    setEditName(tpl.name);
    setEditDesc(tpl.description);
    setEditFields([...tpl.selectedFields]);
  };

  const handleSaveEdit = async (tplId: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/share/templates/${encodeURIComponent(tplId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          selectedFields: editFields,
          profileId: profile.id
        })
      });
      const data = await res.json();
      if (!res.ok || !data.template) {
        throw new Error(data.error || 'Failed to update template.');
      }
      setTemplates((prev) => prev.map((t) => (t.id === tplId ? data.template : t)));
      setEditingId(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tplId: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/share/templates/${encodeURIComponent(tplId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete template.');
      }
      setTemplates((prev) => prev.filter((t) => t.id !== tplId));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          A template saves a preset group of profile details. Selecting a template updates your share selection while still enforcing Never Share &amp; profile visibility rules.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-10 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading templates...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const isSelected = activeTemplateId === tpl.id;
            const isPreviewOpen = previewingId === tpl.id;
            const isEditingThis = editingId === tpl.id;
            const safeForProfile = filterAuthorizedSelection(profile, tpl.selectedFields, {
              allowConfirmedPrivate: false
            });

            return (
              <div
                key={tpl.id}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  isSelected
                    ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900'
                    : tpl.isBuiltIn && tpl.presetKey === 'general'
                    ? 'border-zinc-900 dark:border-zinc-700 bg-black text-white dark:bg-zinc-950'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-white/[0.03]'
                }`}
              >
                {(() => {
                  const isDarkFeatured = !isSelected && tpl.isBuiltIn && tpl.presetKey === 'general';
                  return (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {tpl.isBuiltIn && <Lock className={`w-3.5 h-3.5 ${isDarkFeatured ? 'text-amber-400' : 'text-slate-400'}`} />}
                            <h4 className={`text-sm font-bold truncate ${isDarkFeatured ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {tpl.name}
                            </h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isDarkFeatured ? 'bg-white/15 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                              {safeForProfile.authorizedFields.length} items
                            </span>
                          </div>
                          {tpl.description && (
                            <p className={`text-xs mt-1 leading-relaxed ${isDarkFeatured ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                              {tpl.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Field Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {safeForProfile.authorizedFields.slice(0, 5).map((fKey) => (
                          <span
                            key={fKey}
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                              isDarkFeatured
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/10'
                            }`}
                          >
                            {SHAREABLE_FIELD_MAP[fKey]?.label || fKey}
                          </span>
                        ))}
                        {safeForProfile.authorizedFields.length > 5 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDarkFeatured ? 'bg-white/10 text-slate-200' : 'text-slate-500'}`}>
                            +{safeForProfile.authorizedFields.length - 5} more
                          </span>
                        )}
                      </div>

                      {/* Preview Expanded */}
                      {isPreviewOpen && (
                        <div className={`p-3 rounded-xl text-[11px] space-y-1.5 ${isDarkFeatured ? 'bg-black/30 text-slate-200' : 'bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>
                          <div className="font-bold">Included Details:</div>
                          <div>
                            {safeForProfile.authorizedFields
                              .map((k) => SHAREABLE_FIELD_MAP[k]?.label || k)
                              .join(' · ')}
                          </div>
                          {safeForProfile.blockedNeverShare.length > 0 && (
                            <div className="text-rose-400">
                              Blocked by Never Share: {safeForProfile.blockedNeverShare.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline Edit Mode for Custom Templates */}
                      {isEditingThis && !tpl.isBuiltIn && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 space-y-2.5 text-left">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Template name"
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Short description"
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                          />
                          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                            {SHAREABLE_FIELDS.filter((f) => f.defaultPrivacy === 'normal').map((f) => {
                              const active = editFields.includes(f.key);
                              return (
                                <button
                                  key={f.key}
                                  type="button"
                                  onClick={() =>
                                    setEditFields((prev) =>
                                      prev.includes(f.key) ? prev.filter((k) => k !== f.key) : [...prev, f.key]
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer ${
                                    active
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleSaveEdit(tpl.id)}
                              className="px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Template Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onApplyTemplate(tpl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isDarkFeatured
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Use Template</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewingId((prev) => (prev === tpl.id ? null : tpl.id))}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                            isDarkFeatured
                              ? 'border-white/25 text-white hover:bg-white/10'
                              : 'border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(tpl.id)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                            isDarkFeatured
                              ? 'border-white/25 text-white hover:bg-white/10'
                              : 'border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10'
                          }`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicate</span>
                        </button>

                        {!tpl.isBuiltIn && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(tpl)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(tpl.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                              aria-label={`Delete ${tpl.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* + Create a Template Box (SH6) */}
      {isCreating ? (
        <form
          onSubmit={handleCreateCustom}
          className="p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
              <span>Save Current Selection as Custom Template</span>
            </h4>
          </div>

          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name (e.g. Conference Investor)"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />

          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Template ({currentSelectedFields.length} items)</span>
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="w-full p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/35 text-left transition-all cursor-pointer bg-slate-50/50 dark:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 dark:text-white">
            <Plus className="w-4 h-4 text-zinc-900 dark:text-white" />
            <span>Create a custom template</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Save your current field selection ({currentSelectedFields.length} items) for one-tap reuse.
          </p>
        </button>
      )}

      {/* Physical Card & QR Export Quick Section (SH6 bottom strip) */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Use Your Code Everywhere
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onQuickQrAction}
            className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 flex flex-col items-center gap-1.5 text-center cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">QR Code Ready</span>
          </button>
          <button
            type="button"
            onClick={onQuickDownloadCardPdf}
            className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 flex flex-col items-center gap-1.5 text-center cursor-pointer"
          >
            <FileDown className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Print Card PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
