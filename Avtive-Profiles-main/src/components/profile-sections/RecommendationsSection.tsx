'use client';

import React, { useState } from 'react';
import { Quote, MessageSquare, Loader2, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';
import { ProfileData, RecommendationItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from '@/components/ui/formControls';

export interface RecommendationsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function RecommendationsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: RecommendationsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const rawRecommendations: RecommendationItem[] = Array.isArray(profile.recommendations)
    ? profile.recommendations
    : [];

  // Sort newest-first based on creation timestamp or ID
  const sortedRecommendations = React.useMemo(() => {
    return [...rawRecommendations].sort((a: any, b: any) => {
      const timeA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : typeof a.id === 'string' && a.id.match(/^rec-(\d+)$/)
        ? Number(a.id.match(/^rec-(\d+)$/)![1])
        : 0;
      const timeB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : typeof b.id === 'string' && b.id.match(/^rec-(\d+)$/)
        ? Number(b.id.match(/^rec-(\d+)$/)![1])
        : 0;
      return timeB - timeA;
    });
  }, [rawRecommendations]);

  const handleItemsChange = (items: RecommendationItem[]) => {
    onUpdateField?.('recommendations', items);
  };

  const handleSubmitRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanName = authorName.replace(/<[^>]*>?/gm, '').trim();
    const cleanMessage = message.replace(/<[^>]*>?/gm, '').trim();

    if (!cleanName) {
      setFormError('Please enter your name.');
      return;
    }
    if (cleanName.length > 60) {
      setFormError('Name must be 60 characters or fewer.');
      return;
    }
    if (!cleanMessage) {
      setFormError('Please enter a recommendation message.');
      return;
    }
    if (cleanMessage.length > 500) {
      setFormError('Message must be 500 characters or fewer.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const identifier = profile.slug || profile.id;
      const res = await fetch(`/api/profile/${encodeURIComponent(identifier)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, message: cleanMessage })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit recommendation.');
      }

      setFormSuccess('Thank you! Your recommendation has been submitted.');
      setAuthorName('');
      setMessage('');

      if (data.recommendation) {
        const nextList = [data.recommendation, ...rawRecommendations];
        onUpdateField?.('recommendations', nextList);
      }

      setTimeout(() => {
        setIsFormOpen(false);
        setFormSuccess(null);
      }, 2500);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit recommendation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRecommendationForm = () => (
    <form
      onSubmit={handleSubmitRecommendation}
      className={`p-4 rounded-2xl border ${theme.cardBorder} ${theme.subCardBg} space-y-3 shadow-sm transition-all`}
    >
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
        <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${theme.textPrimary} flex items-center gap-1.5`}>
          <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
          <span>Write a Recommendation</span>
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(false);
            setFormError(null);
            setFormSuccess(null);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          title="Close form"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px]">
          <label className={`font-semibold ${theme.textPrimary}`}>Your Name *</label>
          <span className="text-[10px] text-slate-400 font-mono">{authorName.length}/60</span>
        </div>
        <input
          type="text"
          maxLength={60}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your full name or title"
          disabled={isSubmitting}
          className={`w-full h-11 min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px]">
          <label className={`font-semibold ${theme.textPrimary}`}>Recommendation *</label>
          <span className="text-[10px] text-slate-400 font-mono">{message.length}/500</span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your experience working with them..."
          disabled={isSubmitting}
          className={`w-full p-3 min-h-[80px] rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 resize-y`}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setIsFormOpen(false);
            setFormError(null);
            setFormSuccess(null);
          }}
          disabled={isSubmitting}
          className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !authorName.trim() || !message.trim()}
          className="min-h-[44px] px-5 rounded-xl text-xs font-bold bg-[#6C4CF1] hover:bg-[#5b3de0] text-white shadow-md shadow-[#6C4CF1]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Submitting…</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit Recommendation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  // Fallback for public visitors when no recommendations exist yet
  if (rawRecommendations.length === 0 && !canEdit && !isEditing) {
    return (
      <section
        id="section-recommendations"
        data-section="recommendations"
        className={`px-4 sm:px-6 md:px-8 py-5 space-y-4 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary} flex items-center gap-2`}>
            <Quote className="w-4 h-4 text-cyan-500" />
            <span>Recommendations</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#6C4CF1]/10 hover:bg-[#6C4CF1]/20 text-[#6C4CF1] dark:text-cyan-400 border border-[#6C4CF1]/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Leave a Recommendation</span>
          </button>
        </div>

        {isFormOpen ? (
          renderRecommendationForm()
        ) : (
          <p className={`text-xs ${theme.textSecondary} italic py-1`}>
            No recommendations yet. Be the first to leave one!
          </p>
        )}
      </section>
    );
  }

  return (
    <div className="relative">
      <SectionRepeater<RecommendationItem>
        title="Recommendations"
        sectionKey="recommendations"
        items={sortedRecommendations}
        isEditing={isEditing}
        canEdit={canEdit}
        theme={theme}
        addButtonLabel="Add Recommendation"
        emptyPromptText="No recommendations added yet."
        onSelectSection={onSelectSection}
        onItemsChange={handleItemsChange}
        createNewItem={() => ({
          id: `rec-${Date.now()}`,
          author: '',
          relationship: '',
          text: '',
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          createdAt: new Date().toISOString(),
          visible: true
        })}
        actionSlot={
          !isEditing ? (
            <button
              type="button"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#6C4CF1]/10 hover:bg-[#6C4CF1]/20 text-[#6C4CF1] dark:text-cyan-400 border border-[#6C4CF1]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Leave a Recommendation</span>
            </button>
          ) : null
        }
        renderItemView={(rec) => (
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
              <Quote className="w-4.5 h-4.5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                  {rec.author}
                </h3>
                {rec.date && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                    {rec.date}
                  </span>
                )}
              </div>

              {rec.relationship && (
                <p className={`text-xs font-semibold ${theme.accentText}`}>
                  {rec.relationship}
                </p>
              )}

              {rec.text && (
                <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1 italic`}>
                  &ldquo;{rec.text}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
        renderItemEdit={(rec, _index, updateItem) => (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <FormLabel required>Author / Recommender Name</FormLabel>
                <FormInput
                  value={rec.author || ''}
                  onChange={(val) => updateItem({ author: val })}
                  placeholder="e.g. Sarah Connor, VP of Engineering"
                />
              </div>
              <div>
                <FormLabel>Relationship / Context</FormLabel>
                <FormInput
                  value={rec.relationship || ''}
                  onChange={(val) => updateItem({ relationship: val })}
                  placeholder="e.g. Managed Alex directly at Acme"
                />
              </div>
            </div>

            <div>
              <FormLabel>Date</FormLabel>
              <FormInput
                value={rec.date || ''}
                onChange={(val) => updateItem({ date: val })}
                placeholder="e.g. March 2023"
              />
            </div>

            <div>
              <FormLabel required>Recommendation Text</FormLabel>
              <FormTextarea
                rows={3}
                value={rec.text || ''}
                onChange={(val) => updateItem({ text: val })}
                placeholder="The recommendation quote or testimonial..."
              />
            </div>
          </div>
        )}
      />

      {isFormOpen && !isEditing && (
        <div className="px-4 sm:px-6 md:px-8 pb-5">
          {renderRecommendationForm()}
        </div>
      )}
    </div>
  );
}
