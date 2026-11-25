'use client';

import React, { useMemo, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Loader2, Check, Plus, Layers, RotateCcw } from 'lucide-react';
import { ProfileData, DynamicSection } from '@/types/profile';
import { BackgroundTheme } from '@/data/backgroundThemes';
import { ThemeConfig } from '@/components/ui/themeStyles';
import { useProfileEditor } from '@/context/ProfileEditorContext';
import { getCanonicalSectionOrder, normalizeSectionKey } from '@/lib/sections';
import { BackgroundSelectorCard } from '@/components/editor/BackgroundSelectorCard';
import { IdentityEditorCard } from '@/components/editor/IdentityEditorCard';
import { ProfileVisibilityCard } from '@/components/editor/ProfileVisibilityCard';
import { EditableSectionCard, SECTION_CONFIG } from '@/components/editor/EditableSectionCard';

export interface ProfileEditorSheetProps {
  profile: ProfileData;
  theme: ThemeConfig;
  isUploadingAvatar?: boolean;
  isUploadingCover?: boolean;
  onCancelClose: () => void;
  onDoneClose: (savedProfile: ProfileData) => void;
  onSavePartial: (partial: Partial<ProfileData>, clearFields?: string[]) => Promise<ProfileData>;
  onPreviewBackgroundTheme?: (theme: BackgroundTheme | null) => void;
  onShowToast?: (msg: string) => void;
}

export function ProfileEditorSheet({
  profile,
  theme,
  isUploadingAvatar,
  isUploadingCover,
  onCancelClose,
  onDoneClose,
  onSavePartial,
  onPreviewBackgroundTheme,
  onShowToast,
}: ProfileEditorSheetProps) {
  const {
    liveProfile,
    activeTheme,
    isDirty,
    isSaving,
    autosaveStatus,
    updateField,
    updateProfilePartial,
    flushAutosave,
    discardUnsavedChanges,
    sectionOrder,
    setSectionOrder,
    handleMoveSection,
    isSectionVisible,
    handleToggleSectionVisibility,
    toggleVisibilityField,
    dynamicSections,
    setDynamicSections,
  } = useProfileEditor();

  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [justSavedFeedback, setJustSavedFeedback] = useState(false);

  const hasUnsavedWork = isDirty || autosaveStatus === 'saving' || autosaveStatus === 'error';

  const orderedSectionKeys = useMemo(() => {
    const dynKeys = (dynamicSections || []).map((s) => s.key || s.id).filter(Boolean);
    const ordered = getCanonicalSectionOrder(sectionOrder, liveProfile.type, dynKeys);
    const withResume = ordered.includes('resume') ? ordered : [...ordered, 'resume'];
    return withResume.filter((raw) => {
      const canon = normalizeSectionKey(raw);
      return Boolean(
        SECTION_CONFIG[canon] ||
          (dynamicSections || []).some((s) => s.key === raw || s.id === raw || s.key === canon)
      );
    });
  }, [sectionOrder, liveProfile.type, dynamicSections]);

  const handleCancelClick = () => {
    if (hasUnsavedWork && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    discardUnsavedChanges();
    onPreviewBackgroundTheme?.(null);
    setConfirmDiscard(false);
    onCancelClose();
  };

  const handleConfirmDiscard = () => {
    discardUnsavedChanges();
    onPreviewBackgroundTheme?.(null);
    setConfirmDiscard(false);
    onCancelClose();
  };

  const handleDoneClick = async () => {
    if (isUploadingAvatar || isUploadingCover) {
      onShowToast?.('Please wait for image upload to finish before saving.');
      return;
    }

    const res = await flushAutosave();
    if (!res.ok) {
      onShowToast?.(res.error || 'Failed to save changes. Please retry.');
      return;
    }

    setJustSavedFeedback(true);
    onPreviewBackgroundTheme?.(null);
    const saved = res.profile || liveProfile;
    setTimeout(() => {
      onDoneClose(saved);
    }, 180);
  };

  const handleAddDynamicSection = () => {
    const clean = newSectionTitle.trim();
    if (!clean) return;
    const id = `dyn-${Date.now()}`;
    const newSec: DynamicSection = {
      id,
      key: id,
      title: clean,
      type: 'customFields',
      visible: true,
      order: orderedSectionKeys.length,
      data: '',
      customFields: [],
    };
    const nextDynamic = [...(dynamicSections || []), newSec];
    setDynamicSections(nextDynamic);
    updateField('dynamicSections', nextDynamic);
    setSectionOrder([...orderedSectionKeys, id]);
    updateField('sectionOrder', [...orderedSectionKeys, id]);
    setNewSectionTitle('');
    setIsAddingCustomSection(false);
  };

  const handleDeleteDynamicSection = (sectionKeyOrId: string) => {
    const nextDynamic = (dynamicSections || []).filter(
      (s) => s.id !== sectionKeyOrId && s.key !== sectionKeyOrId
    );
    setDynamicSections(nextDynamic);
    updateField('dynamicSections', nextDynamic);
    const nextOrder = orderedSectionKeys.filter((k) => k !== sectionKeyOrId);
    setSectionOrder(nextOrder);
    updateField('sectionOrder', nextOrder);
  };

  const handleRestoreAllHidden = () => {
    const nextVis = { ...(liveProfile.sectionVisibility || {}) };
    orderedSectionKeys.forEach((key) => {
      const canon = normalizeSectionKey(key);
      nextVis[key] = true;
      nextVis[canon] = true;
    });
    updateField('sectionVisibility', nextVis);
    onShowToast?.('All profile sections are now visible');
  };

  const hiddenCount = orderedSectionKeys.filter((k) => !isSectionVisible(k)).length;

  return (
    <motion.div
      key="profile-editor-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end justify-center"
      data-testid="profile-editor-sheet-overlay"
    >
      <motion.div
        key="profile-editor-sheet"
        initial={{ y: '100%', opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.9 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profile"
        data-testid="profile-editor-sheet"
        className="w-full max-w-2xl h-[94dvh] sm:h-[90dvh] rounded-t-3xl bg-zinc-50 dark:bg-black border-t border-x border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* P3 Sticky Top Editing Header: Cancel | EDITING | Done */}
        <header className="sticky top-0 z-30 shrink-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 pt-3 pb-3">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-2.5" />
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Left: Cancel */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSaving}
                className="min-h-[38px] px-3 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* Center: EDITING + Save state */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-950 dark:text-white">
                EDITING
              </span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {justSavedFeedback
                  ? 'Saved'
                  : isSaving || autosaveStatus === 'saving'
                  ? 'Saving...'
                  : hasUnsavedWork
                  ? 'Unsaved changes'
                  : 'All changes saved'}
              </span>
            </div>

            {/* Right: Done */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDoneClick}
                disabled={isSaving}
                className="min-h-[38px] px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : justSavedFeedback ? (
                  <Check className="w-3.5 h-3.5" />
                ) : null}
                <span>{isSaving ? 'Saving...' : justSavedFeedback ? 'Saved' : 'Done'}</span>
              </button>
            </div>
          </div>

          {/* Unsaved Changes Confirmation Bar */}
          {confirmDiscard && (
            <div className="mt-2.5 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Discard unsaved changes? Previously saved changes stay intact.
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-semibold cursor-pointer"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Scrollable P3 Editor Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 space-y-4">
          {/* B. Background Selection Card */}
          <BackgroundSelectorCard
            profile={liveProfile}
            theme={theme}
            onUpdateFields={updateProfilePartial}
            onPreviewOccasionTheme={onPreviewBackgroundTheme}
            onShowToast={onShowToast}
          />

          {/* C. Profile Identity Card */}
          <IdentityEditorCard
            profile={liveProfile}
            theme={theme}
            activeTheme={activeTheme}
            onUpdateField={updateField}
            onShowToast={onShowToast}
          />

          {/* D. Profile Visibility Control */}
          <ProfileVisibilityCard
            value={liveProfile.profileVisibility === 'private' ? 'private' : 'public'}
            onChange={(val) => updateField('profileVisibility', val)}
          />

          {/* E. All Profile Sections */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Sections
              </span>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreAllHidden}
                  className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Show {hiddenCount} hidden
                </button>
              )}
            </div>

            <Reorder.Group
              axis="y"
              values={orderedSectionKeys}
              onReorder={(newOrder) => {
                setSectionOrder(newOrder);
                updateField('sectionOrder', newOrder);
              }}
              className="space-y-2.5"
            >
              {orderedSectionKeys.map((secKey, idx) => (
                <EditableSectionCard
                  key={secKey}
                  sectionKey={secKey}
                  profile={liveProfile}
                  theme={theme}
                  index={idx}
                  total={orderedSectionKeys.length}
                  isVisible={isSectionVisible(secKey)}
                  onMoveUp={() => handleMoveSection(idx, 'up')}
                  onMoveDown={() => handleMoveSection(idx, 'down')}
                  onToggleVisibility={() => handleToggleSectionVisibility(secKey)}
                  onUpdateField={updateField}
                  onSavePartial={onSavePartial}
                  onDeleteDynamicSection={handleDeleteDynamicSection}
                  onToggleContactFieldVisibility={(field) => toggleVisibilityField(field)}
                  onShowToast={onShowToast}
                />
              ))}
            </Reorder.Group>
          </div>

          {/* Add Custom Section */}
          <div className="pt-1 pb-6">
            {isAddingCustomSection ? (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <Layers className="w-4 h-4" />
                  <span>New Custom Section</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="e.g., Speaking Engagements, Open Source..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white outline-none focus:border-black dark:focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomSection(false)}
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDynamicSection}
                    disabled={!newSectionTitle.trim()}
                    className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold cursor-pointer disabled:opacity-40"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCustomSection(true)}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Section</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
