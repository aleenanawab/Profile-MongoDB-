'use client';

import React from 'react';
import { Languages, Plus, X } from 'lucide-react';
import { ProfileData, LanguageItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, SectionSaveBar } from '@/components/ui/formControls';
import { VisibilityEyeButton } from '@/components/ui/VisibilityEyeButton';
import { SearchableCombobox } from '@/components/forms/SearchableCombobox';
import { WORLD_LANGUAGES, LANGUAGE_PROFICIENCY_LEVELS } from '@/data/languagesDataset';

interface LanguagesSectionProps {
  profile: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function LanguagesSection({
  profile,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: LanguagesSectionProps) {
  const [languagesDraft, setLanguagesDraft] = React.useState<LanguageItem[]>(profile.languages || []);
  const [snapshot, setSnapshot] = React.useState<LanguageItem[]>(profile.languages || []);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const isDirty = JSON.stringify(languagesDraft) !== JSON.stringify(snapshot);

  const lastProfileIdRef = React.useRef(profile.id);
  React.useEffect(() => {
    const isProfileSwitch = profile.id !== lastProfileIdRef.current;
    if (isProfileSwitch) {
      lastProfileIdRef.current = profile.id;
      const nextLangs = profile.languages || [];
      setLanguagesDraft(nextLangs);
      setSnapshot(nextLangs);
      return;
    }

    if (!isDirty) {
      const incoming = profile.languages || [];
      if (JSON.stringify(incoming) !== JSON.stringify(snapshot)) {
        setLanguagesDraft(incoming);
        setSnapshot(incoming);
      }
    }
  }, [profile.id, profile.languages, isDirty, snapshot]);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        languages: languagesDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('languages', languagesDraft);
      setSnapshot(languagesDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save languages');
    }
  };

  const handleCancel = () => {
    setLanguagesDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const visibleLanguages = (isEditing || canEdit)
    ? languagesDraft
    : languagesDraft.filter((l) => l.visible !== false);
  const hasLanguages = visibleLanguages.length > 0;

  const handleToggleLanguageVisibility = async (idx: number) => {
    const target = visibleLanguages[idx];
    const next = languagesDraft.map((l) =>
      l === target || (l.language && target?.language && l.language === target.language)
        ? { ...l, visible: l.visible === false ? true : false }
        : l
    );
    setLanguagesDraft(next);
    setSnapshot(next);
    onUpdateField?.('languages', next);
    if (onSavePartial) {
      try {
        await onSavePartial({ languages: next });
      } catch (err) {
        console.error('Failed to persist language visibility:', err);
      }
    }
  };

  if (!hasLanguages && !canEdit && !isEditing) {
    return null;
  }

  const handleAddLanguage = () => {
    const existing = new Set(languagesDraft.map((l) => l.language.toLowerCase().trim()));
    const firstOpt = WORLD_LANGUAGES.find((lang) => !existing.has(lang.name.toLowerCase()) && !existing.has(lang.value.toLowerCase()));
    const firstAvailable = firstOpt ? firstOpt.name : '';
    const newLang: LanguageItem = {
      language: firstAvailable,
      proficiency: 'Professional Working'
    };
    setLanguagesDraft((prev) => {
      const next = [...prev, newLang];
      onUpdateField?.('languages', next);
      return next;
    });
  };

  const handleUpdateLanguage = (index: number, updates: Partial<LanguageItem>) => {
    setLanguagesDraft((prev) => {
      const next = prev.map((l, idx) => (idx === index ? { ...l, ...updates } : l));
      onUpdateField?.('languages', next);
      return next;
    });
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguagesDraft((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      onUpdateField?.('languages', next);
      return next;
    });
  };

  return (
    <section
      onClick={() => canEdit && !isEditing && onSelectSection?.('languages')}
      className={`px-4 @md:px-6 @2xl:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${canEdit && !isEditing && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
        }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Languages
        </h2>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddLanguage}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Language</span>
          </button>
        ) : (
          canEdit && onSelectSection && (
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
              Click to edit
            </span>
          )
        )}
      </div>

      {hasLanguages ? (
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-2.5">
          {visibleLanguages.map((lang, idx) => {
            const isLangVisible = lang.visible !== false;
            const otherSelected = new Set(
              languagesDraft
                .filter((_, i) => i !== idx && Boolean(_.language))
                .map((item) => item.language.trim().toLowerCase())
            );
            const availableOptions = WORLD_LANGUAGES.filter(
              (opt) => !otherSelected.has(opt.name.toLowerCase()) && !otherSelected.has(opt.value.toLowerCase())
            );

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border shadow-2xs ${
                  !isLangVisible
                    ? 'border-dashed border-amber-500/45 bg-amber-500/[0.04] opacity-70'
                    : `${theme.cardBg} ${theme.cardBorder}`
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  /* Editable Language Item */
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div>
                          <FormLabel>Language</FormLabel>
                          <SearchableCombobox
                            options={availableOptions}
                            value={lang.language || ''}
                            onChange={(val) => handleUpdateLanguage(idx, { language: val as string })}
                            placeholder="Select or type language (e.g. English, French)..."
                            allowCustom
                          />
                        </div>
                        <div>
                          <FormLabel>Proficiency Level</FormLabel>
                          <select
                            value={lang.proficiency || 'Professional Working'}
                            onChange={(e) => handleUpdateLanguage(idx, { proficiency: e.target.value })}
                            className={`w-full h-10 px-3 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-zinc-900/15`}
                          >
                            {LANGUAGE_PROFICIENCY_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 mt-6"
                        title="Remove language"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Language Item */
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0`}>
                        <Languages className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold ${theme.textPrimary} truncate`}>
                          {lang.language}
                        </h4>
                        <p className={`text-[10px] ${theme.textSecondary}`}>
                          {lang.proficiency}
                        </p>
                      </div>
                    </div>
                    {canEdit && !isEditing && (
                      <VisibilityEyeButton
                        visible={isLangVisible}
                        label={lang.language || 'language'}
                        onToggle={() => handleToggleLanguageVisibility(idx)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No language proficiencies added yet.
          </p>
        </div>
      )}

      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Languages"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}
