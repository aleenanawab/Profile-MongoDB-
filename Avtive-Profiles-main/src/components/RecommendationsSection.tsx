'use client';

import React, { useState } from 'react';
import { Quote, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { ProfileData, RecommendationItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from './ui/formControls';

interface RecommendationsSectionProps {
  profile: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function RecommendationsSection({ 
  profile, 
  theme = getThemeConfig(profile.theme || 'elegant'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: RecommendationsSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [recommendationsDraft, setRecommendationsDraft] = useState<RecommendationItem[]>(profile.recommendations || []);
  const [snapshot, setSnapshot] = useState<RecommendationItem[]>(profile.recommendations || []);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  React.useEffect(() => {
    const next = profile.recommendations || [];
    setRecommendationsDraft(next);
    setSnapshot(next);
  }, [profile.id, profile.recommendations]);

  const isDirty = JSON.stringify(recommendationsDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        recommendations: recommendationsDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('recommendations', recommendationsDraft);
      setSnapshot(recommendationsDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save recommendations');
    }
  };

  const handleCancel = () => {
    setRecommendationsDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasRecommendations = recommendationsDraft.length > 0;

  if (!hasRecommendations && !canEdit && !isEditing) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddRec = () => {
    const newRec: RecommendationItem = {
      id: `rec-${Date.now()}`,
      author: 'Recommender Name',
      designation: 'Title / Position',
      company: 'Organization',
      summary: 'Recommendation endorsement or testimonial statement...'
    };
    setRecommendationsDraft((prev) => [newRec, ...prev]);
  };

  const handleUpdateItem = (id: string, updates: Partial<RecommendationItem>) => {
    setRecommendationsDraft((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleRemoveItem = (id: string) => {
    setRecommendationsDraft((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('recommendations')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Recommendations
        </h2>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddRec}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recommendation</span>
          </button>
        ) : (
          canEdit && onSelectSection && (
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
              Click to edit
            </span>
          )
        )}
      </div>

      {hasRecommendations ? (
        <div className="space-y-3">
          {recommendationsDraft.map((rec) => {
            const isExpanded = !!expandedIds[rec.id];

            return (
              <div
                key={rec.id}
                className={`p-4 sm:p-5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-3 shadow-2xs transition-all`}
                onClick={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  /* Editable Recommendation Card */
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <FormLabel required>Author / Recommender</FormLabel>
                          <FormInput
                            value={rec.author || (rec as any).authorName || ''}
                            onChange={(val) => handleUpdateItem(rec.id, { author: val })}
                            placeholder="e.g. Sarah Jenkins"
                          />
                        </div>
                        <div>
                          <FormLabel>Designation / Role</FormLabel>
                          <FormInput
                            value={rec.designation || ''}
                            onChange={(val) => handleUpdateItem(rec.id, { designation: val })}
                            placeholder="e.g. VP of Product"
                          />
                        </div>
                        <div>
                          <FormLabel>Company</FormLabel>
                          <FormInput
                            value={rec.company || ''}
                            onChange={(val) => handleUpdateItem(rec.id, { company: val })}
                            placeholder="e.g. Acme Tech"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(rec.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 mt-6"
                        title="Remove recommendation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <FormLabel required>Endorsement Statement</FormLabel>
                      <FormTextarea
                        rows={3}
                        value={rec.fullText || rec.summary || ''}
                        onChange={(val) => handleUpdateItem(rec.id, { summary: val, fullText: val })}
                        placeholder="Write the recommendation or endorsement statement..."
                      />
                    </div>
                  </div>
                ) : (
                  /* View Recommendation Card */
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder}`}>
                          <Quote className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${theme.textPrimary}`}>
                            {rec.author || (rec as any).authorName}
                          </h4>
                          {rec.designation && (
                            <p className={`text-[10px] ${theme.textSecondary}`}>
                              {rec.designation} {rec.company ? `• ${rec.company}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(rec.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${theme.textPrimary} ${theme.cardBg} border ${theme.subCardBorder} transition-colors shadow-2xs active:scale-95 cursor-pointer`}
                      >
                        <span>{isExpanded ? 'Hide' : 'View Recommendation'}</span>
                        {isExpanded ? (
                          <ChevronUp className={`w-3 h-3 ${theme.accentText}`} />
                        ) : (
                          <ChevronDown className={`w-3 h-3 ${theme.accentText}`} />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className={`pt-2 border-t ${theme.divider} space-y-2 text-xs leading-relaxed ${theme.textSecondary}`}>
                        <p className="italic font-sans">
                          &ldquo;{rec.fullText || rec.summary}&rdquo;
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No recommendations added yet.
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
          saveLabel="Save Recommendations"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}
