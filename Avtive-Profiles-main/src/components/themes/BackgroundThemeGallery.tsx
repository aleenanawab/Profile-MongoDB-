'use client';

import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Eye, 
  Trash2, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  Layers, 
  X,
  Info
} from 'lucide-react';
import { 
  BACKGROUND_THEMES, 
  BACKGROUND_THEME_CATEGORIES, 
  BackgroundTheme, 
  getBackgroundTheme 
} from '@/data/backgroundThemes';
import { ProfileData } from '@/types/profile';
import { ThemeConfig } from '@/components/ui/themeStyles';

interface BackgroundThemeGalleryProps {
  profile: ProfileData;
  isEditing?: boolean;
  canEdit?: boolean;
  theme?: ThemeConfig;
  onUpdateSavedThemes?: (savedIds: string[]) => void;
  onUpdateActiveTheme?: (activeId: string | null) => void;
  onPreviewTheme?: (theme: BackgroundTheme | null) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
}

export function BackgroundThemeGallery({
  profile,
  isEditing = false,
  canEdit = false,
  theme,
  onUpdateSavedThemes,
  onUpdateActiveTheme,
  onPreviewTheme,
  onSavePartial
}: BackgroundThemeGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewingThemeId, setPreviewingThemeId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const savedThemeIds = profile.savedBackgroundThemeIds || [];
  const activeThemeId = profile.activeBackgroundThemeId || null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  // Filter themes by category
  const filteredThemes = BACKGROUND_THEMES.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  // Get active theme object
  const activeThemeObj = getBackgroundTheme(activeThemeId);

  // Get saved theme objects
  const savedThemeObjs = savedThemeIds
    .map(id => getBackgroundTheme(id))
    .filter((t): t is BackgroundTheme => Boolean(t));

  const handleSetActive = async (themeId: string) => {
    // If not in saved list, add it automatically
    const newSaved = savedThemeIds.includes(themeId)
      ? savedThemeIds
      : [...savedThemeIds, themeId];

    onUpdateActiveTheme?.(themeId);
    onUpdateSavedThemes?.(newSaved);
    setPreviewingThemeId(null);
    onPreviewTheme?.(null);

    if (onSavePartial) {
      try {
        await onSavePartial({
          activeBackgroundThemeId: themeId,
          savedBackgroundThemeIds: newSaved
        });
      } catch (e) {
        console.error('Failed to auto-save background theme selection:', e);
      }
    }
    const themeName = getBackgroundTheme(themeId)?.name || 'Theme';
    showFeedback(`Applied "${themeName}" as active background`);
  };

  const handleClearActive = async () => {
    onUpdateActiveTheme?.(null);
    setPreviewingThemeId(null);
    onPreviewTheme?.(null);

    if (onSavePartial) {
      try {
        await onSavePartial({
          activeBackgroundThemeId: ''
        });
      } catch (e) {
        console.error('Failed to clear active background:', e);
      }
    }
    showFeedback('Reset background to default');
  };

  const handleToggleSave = async (themeId: string) => {
    let newSaved: string[];
    let isNowSaved = false;

    if (savedThemeIds.includes(themeId)) {
      newSaved = savedThemeIds.filter(id => id !== themeId);
      // If we remove the currently active theme, also clear active
      if (activeThemeId === themeId) {
        onUpdateActiveTheme?.(null);
      }
    } else {
      newSaved = [...savedThemeIds, themeId];
      isNowSaved = true;
    }

    onUpdateSavedThemes?.(newSaved);

    if (onSavePartial) {
      try {
        await onSavePartial({
          savedBackgroundThemeIds: newSaved,
          ...(activeThemeId === themeId && !isNowSaved ? { activeBackgroundThemeId: '' } : {})
        });
      } catch (e) {
        console.error('Failed to save background collection:', e);
      }
    }

    const themeName = getBackgroundTheme(themeId)?.name || 'Theme';
    showFeedback(isNowSaved ? `Saved "${themeName}" to your collection` : `Removed "${themeName}" from collection`);
  };

  const handlePreview = (themeItem: BackgroundTheme) => {
    if (previewingThemeId === themeItem.id) {
      // Toggle off preview
      setPreviewingThemeId(null);
      onPreviewTheme?.(null);
    } else {
      setPreviewingThemeId(themeItem.id);
      onPreviewTheme?.(themeItem);
      showFeedback(`Previewing "${themeItem.name}" live`);
    }
  };

  return (
    <div 
      id="section-backgrounds" 
      data-section="backgrounds"
      className="px-4 sm:px-6 md:px-8 py-6 border-t border-slate-200/80 dark:border-white/10 transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Background Themes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider">
                  Snapchat+ Style
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize your profile page backdrop. Save multiple favorites and switch anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Status / Reset Action */}
        <div className="flex items-center gap-2 shrink-0">
          {actionFeedback && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              {actionFeedback}
            </span>
          )}
          {activeThemeId && (
            <button
              type="button"
              onClick={handleClearActive}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset to default neutral background"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Default</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* Section 1: Personal Saved Collection                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <div className="mb-6 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              My Saved Collection
            </h3>
            <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono font-bold">
              {savedThemeObjs.length}
            </span>
          </div>
          {activeThemeObj && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Active:</span>
              <span className="font-bold text-slate-900 dark:text-white">{activeThemeObj.name}</span>
            </div>
          )}
        </div>

        {savedThemeObjs.length === 0 ? (
          <div className="text-center py-5 px-4 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
            <Sparkles className="w-6 h-6 mx-auto text-purple-400 mb-1.5 opacity-60" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No saved backgrounds in your collection yet.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Browse themes below and click &quot;Save&quot; or &quot;Apply&quot; to build your personal gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {savedThemeObjs.map((savedTheme) => {
              const isActive = activeThemeId === savedTheme.id;
              const isPreviewing = previewingThemeId === savedTheme.id;

              return (
                <div
                  key={`saved-${savedTheme.id}`}
                  className={`relative group rounded-xl border p-2.5 transition-all overflow-hidden ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/5 shadow-xs ring-1 ring-purple-500/30'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1120] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {/* Swatch Thumbnail */}
                  <div 
                    className="w-full h-16 rounded-lg mb-2 relative overflow-hidden shadow-inner border border-black/10 cursor-pointer"
                    style={savedTheme.backgroundStyle}
                    onClick={() => handleSetActive(savedTheme.id)}
                    title={`Click to set ${savedTheme.name} as active background`}
                  >
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white rounded-full p-0.5 shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    {isPreviewing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold tracking-wider uppercase">
                        Previewing
                      </div>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {savedTheme.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {savedTheme.categoryLabel}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                    {isActive ? (
                      <span className="flex-1 text-[11px] font-bold text-center text-purple-600 dark:text-purple-400 py-1">
                        Active ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetActive(savedTheme.id)}
                        className="flex-1 text-[11px] font-bold py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors cursor-pointer text-center"
                      >
                        Apply
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePreview(savedTheme)}
                      className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                        isPreviewing
                          ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-400 text-purple-600'
                          : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500'
                      }`}
                      title={isPreviewing ? "Stop previewing" : "Preview live on profile"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSave(savedTheme.id)}
                      className="p-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-rose-500/10 hover:border-rose-400/40 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove from saved collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* Section 2: Explore Available Themes                                        */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Explore Theme Gallery</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredThemes.length} presets
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
          {BACKGROUND_THEME_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredThemes.map(themeItem => {
            const isActive = activeThemeId === themeItem.id;
            const isSaved = savedThemeIds.includes(themeItem.id);
            const isPreviewing = previewingThemeId === themeItem.id;

            return (
              <div
                key={themeItem.id}
                className={`group rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'border-purple-500 bg-purple-500/[0.03] shadow-md ring-1 ring-purple-500/30'
                    : 'border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0A101E] hover:border-purple-400/50 hover:shadow-sm'
                }`}
              >
                {/* Visual Swatch Preview Box */}
                <div 
                  className="w-full h-28 relative cursor-pointer overflow-hidden border-b border-black/10"
                  style={themeItem.backgroundStyle}
                  onClick={() => handleSetActive(themeItem.id)}
                  title={`Click to apply ${themeItem.name}`}
                >
                  {/* Subtle vignette / overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Top badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-medium border border-white/15">
                      {themeItem.categoryLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Active
                        </span>
                      )}
                      {isPreviewing && !isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold shadow-md">
                          Previewing
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Swatch Info */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                    <span className="text-xs font-bold drop-shadow-md truncate">
                      {themeItem.name}
                    </span>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider font-mono">
                      {themeItem.isDark ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </div>

                {/* Theme Description */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {themeItem.description}
                  </p>

                  {/* Card Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                    {isActive ? (
                      <button
                        type="button"
                        onClick={handleClearActive}
                        className="flex-1 py-1.5 px-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Active Background (Click to Remove)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetActive(themeItem.id)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer text-center"
                      >
                        Apply Theme
                      </button>
                    )}

                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => handlePreview(themeItem)}
                      className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isPreviewing
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-600 dark:text-cyan-300 font-bold'
                          : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Preview this background live on your profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isPreviewing ? 'Close' : 'Preview'}</span>
                    </button>

                    {/* Save to Collection Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSave(themeItem.id)}
                      className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-purple-500/10 border-purple-400/40 text-purple-600 dark:text-purple-300'
                          : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                      title={isSaved ? "Remove from personal collection" : "Save to personal collection"}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-purple-500" />
                          <span className="hidden sm:inline">Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
