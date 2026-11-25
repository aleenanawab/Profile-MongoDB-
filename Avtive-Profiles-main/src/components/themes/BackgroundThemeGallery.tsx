'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Check,
  Eye,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  CalendarDays,
  Flame,
  PartyPopper
} from 'lucide-react';
import {
  BACKGROUND_THEMES,
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

interface CategoryFilter {
  id: string;
  label: string;
  icon: React.ElementType;
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  { id: 'all', label: 'All Themes', icon: LayoutGrid },
  { id: 'occasions', label: 'Occasions', icon: CalendarDays },
  { id: 'festivals', label: 'Festivals', icon: Flame },
  { id: 'celebrations', label: 'Celebrations', icon: PartyPopper },
  { id: 'everyday', label: 'Everyday', icon: Palette },
];

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

  const savedThemeIds = profile.savedBackgroundThemeIds || [];
  const activeThemeId = profile.activeBackgroundThemeId || null;

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
        console.error('Failed to auto-save background selection:', e);
      }
    }
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
        console.error('Failed to clear background:', e);
      }
    }
  };

  const handleToggleSave = async (themeId: string) => {
    let newSaved: string[];
    const isCurrentlySaved = savedThemeIds.includes(themeId);

    if (isCurrentlySaved) {
      newSaved = savedThemeIds.filter(id => id !== themeId);
      if (activeThemeId === themeId) {
        onUpdateActiveTheme?.(null);
      }
    } else {
      newSaved = [...savedThemeIds, themeId];
    }

    onUpdateSavedThemes?.(newSaved);

    if (onSavePartial) {
      try {
        await onSavePartial({
          savedBackgroundThemeIds: newSaved,
          ...(activeThemeId === themeId && isCurrentlySaved ? { activeBackgroundThemeId: '' } : {})
        });
      } catch (e) {
        console.error('Failed to update saved collection:', e);
      }
    }
  };

  const handlePreview = (themeItem: BackgroundTheme, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewingThemeId === themeItem.id) {
      setPreviewingThemeId(null);
      onPreviewTheme?.(null);
    } else {
      setPreviewingThemeId(themeItem.id);
      onPreviewTheme?.(themeItem);
    }
  };

  const cardBgClass = theme?.cardBg || 'bg-card';
  const cardBorderClass = theme?.cardBorder || 'border-border';
  const textPrimaryClass = theme?.textPrimary || 'text-foreground';
  const textSecondaryClass = theme?.textSecondary || 'text-muted-foreground';
  const dividerClass = theme?.divider || 'border-border';

  return (
    <div
      id="section-backgrounds"
      data-section="backgrounds"
      className={`px-4 sm:px-6 md:px-8 py-5 border-t ${dividerClass} ${cardBgClass} transition-colors`}
    >
      {/* ── 1. Minimal Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Palette className="w-4 h-4 text-primary shrink-0" />
          <h2 className={`text-sm sm:text-base font-bold tracking-tight ${textPrimaryClass} truncate`}>
            Themes
          </h2>
          {activeThemeObj && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium truncate max-w-[140px] sm:max-w-[200px]">
              {activeThemeObj.name}
            </span>
          )}
        </div>

        {/* Reset to Default Action Icon */}
        {activeThemeId && (
          <button
            type="button"
            onClick={handleClearActive}
            className="w-8 h-8 rounded-lg border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Reset to default background"
            aria-label="Reset to default background"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── 2. Category Navigation (Icon-Only Row with Tooltips) ─────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4 min-w-0">
        {CATEGORY_FILTERS.map(cat => {
          const isSelected = selectedCategory === cat.id;
          const IconComp = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 select-none text-xs font-semibold ${isSelected
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              title={cat.label}
              aria-label={cat.label}
            >
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Saved Themes (Compact Horizontal Thumbnails) ────────────────── */}
      {savedThemeObjs.length > 0 && (
        <div className="mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-2">
            <Bookmark className="w-3 h-3 text-primary shrink-0" />
            <span>Saved</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none min-w-0">
            {savedThemeObjs.map((savedTheme) => {
              const isActive = activeThemeId === savedTheme.id;
              const isPreviewing = previewingThemeId === savedTheme.id;

              return (
                <div
                  key={`saved-${savedTheme.id}`}
                  className="relative group shrink-0"
                >
                  <div
                    onClick={() => handleSetActive(savedTheme.id)}
                    style={savedTheme.backgroundStyle}
                    className={`w-20 h-13 rounded-lg border cursor-pointer relative overflow-hidden transition-all shadow-2xs ${isActive
                      ? 'border-primary ring-2 ring-primary/40 shadow-sm'
                      : 'border-border hover:border-foreground/40'
                      }`}
                    title={`Apply ${savedTheme.name}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Apply ${savedTheme.name}`}
                  >
                    {/* Active check icon badge */}
                    {isActive && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Preview overlay indicator */}
                    {isPreviewing && !isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Eye className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Micro action buttons on hover / focus */}
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(savedTheme.id);
                      }}
                      className="w-5 h-5 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive flex items-center justify-center shadow-xs cursor-pointer"
                      title="Remove from saved collection"
                      aria-label={`Remove ${savedTheme.name} from saved`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px] mt-1 text-center">
                    {savedTheme.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. Explore Themes Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {filteredThemes.map(themeItem => {
          const isActive = activeThemeId === themeItem.id;
          const isSaved = savedThemeIds.includes(themeItem.id);
          const isPreviewing = previewingThemeId === themeItem.id;

          return (
            <motion.div
              key={themeItem.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleSetActive(themeItem.id)}
              className={`group rounded-xl border transition-all overflow-hidden flex flex-col justify-between cursor-pointer select-none ${isActive
                ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/40 shadow-xs'
                : `border-border hover:border-foreground/30 ${cardBgClass}`
                }`}
              title={`Click to apply ${themeItem.name}`}
              role="button"
              tabIndex={0}
              aria-label={`Apply ${themeItem.name} background`}
            >
              {/* Thumbnail Swatch */}
              <div
                className="w-full aspect-[16/10] relative overflow-hidden border-b border-border/40"
                style={themeItem.backgroundStyle}
              >
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                {/* Top Badge: Active / Previewing status */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                  {isActive ? (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : isPreviewing ? (
                    <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center shadow-sm">
                      <Eye className="w-3 h-3" />
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              </div>

              {/* Bottom Info & Icon Action Buttons */}
              <div className="p-2 sm:p-2.5 flex items-center justify-between gap-1 min-w-0">
                <span className={`text-xs font-semibold ${textPrimaryClass} truncate`}>
                  {themeItem.name}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Preview Icon Button */}
                  <button
                    type="button"
                    onClick={(e) => handlePreview(themeItem, e)}
                    className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                      isPreviewing
                        ? 'bg-zinc-900/10 dark:bg-white/15 border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-bold'
                        : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    title={isPreviewing ? "Close preview" : "Preview live"}
                    aria-label={`Preview ${themeItem.name}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Save to Collection Icon Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSave(themeItem.id);
                    }}
                    className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${isSaved
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    title={isSaved ? "Remove from collection" : "Save to collection"}
                    aria-label={`Save ${themeItem.name} to collection`}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
