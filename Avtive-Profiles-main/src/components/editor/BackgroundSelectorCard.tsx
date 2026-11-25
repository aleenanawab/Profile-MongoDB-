'use client';

import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Film,
  Sparkles,
  Upload,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X
} from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { ThemeConfig } from '@/components/ui/themeStyles';
import { BackgroundTheme } from '@/data/backgroundThemes';
import { BackgroundThemeGallery } from '@/components/themes/BackgroundThemeGallery';
import { uploadImageToStorage } from '@/lib/imageCompression';
import {
  ANIMATED_VIDEO_PRESETS,
  CURATED_IMAGE_BACKGROUNDS,
  AnimatedVideoBackdrop,
  getBackgroundDescription,
  resolveBackgroundMode
} from './BackgroundRenderer';

type BackgroundTab = 'image' | 'video' | 'occasion';

interface BackgroundSelectorCardProps {
  profile: ProfileData;
  theme: ThemeConfig;
  onPreviewOccasionTheme?: (t: BackgroundTheme | null) => void;
  onUpdateFields: (patch: Partial<ProfileData>) => void;
  onShowToast?: (msg: string) => void;
}

export function BackgroundSelectorCard({
  profile,
  theme,
  onPreviewOccasionTheme,
  onUpdateFields,
  onShowToast
}: BackgroundSelectorCardProps) {
  const resolvedMode = resolveBackgroundMode(profile);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<BackgroundTab>(
    resolvedMode === 'video' ? 'video' : resolvedMode === 'image' ? 'image' : 'occasion'
  );
  const [imageUrlInput, setImageUrlInput] = useState(profile.customBackgroundImage || '');
  const [videoUrlInput, setVideoUrlInput] = useState(
    profile.customBackgroundVideo && !profile.customBackgroundVideo.startsWith('preset:')
      ? profile.customBackgroundVideo
      : ''
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const description = getBackgroundDescription(profile);
  const hasCustomBackground = resolvedMode !== 'default';

  const handleOpenPicker = () => {
    setIsExpanded((prev) => !prev);
    if (!isExpanded) {
      if (resolvedMode === 'image') setActiveTab('image');
      else if (resolvedMode === 'video') setActiveTab('video');
      else setActiveTab('occasion');
    }
  };

  const handleResetToDefault = () => {
    onPreviewOccasionTheme?.(null);
    onUpdateFields({
      backgroundType: 'default',
      customBackgroundImage: '',
      customBackgroundVideo: '',
      activeBackgroundThemeId: ''
    });
    setImageUrlInput('');
    setVideoUrlInput('');
    onShowToast?.('Background reset to minimalist default');
  };

  const handleApplyImage = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    onPreviewOccasionTheme?.(null);
    onUpdateFields({
      backgroundType: 'image',
      customBackgroundImage: clean,
      customBackgroundVideo: '',
      activeBackgroundThemeId: ''
    });
    setImageUrlInput(clean);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';
    setUploadError(null);
    setIsUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file, 'backgrounds');
      handleApplyImage(url);
      onShowToast?.('Background image ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed.';
      setUploadError(msg);
      onShowToast?.(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleApplyVideo = (urlOrPresetId: string) => {
    const clean = urlOrPresetId.trim();
    if (!clean) return;
    onPreviewOccasionTheme?.(null);
    onUpdateFields({
      backgroundType: 'video',
      customBackgroundVideo: clean,
      customBackgroundImage: '',
      activeBackgroundThemeId: ''
    });
    if (!clean.startsWith('preset:')) {
      setVideoUrlInput(clean);
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';
    setUploadError(null);

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Video must be 25MB or smaller.');
      return;
    }

    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'backgrounds');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Video upload failed.');
      }
      handleApplyVideo(data.url);
      onShowToast?.('Animated video background ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Video upload failed.';
      setUploadError(msg);
      onShowToast?.(msg);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleApplyOccasionTheme = (themeId: string | null) => {
    const cleanId = themeId || '';
    onPreviewOccasionTheme?.(null);
    onUpdateFields({
      backgroundType: cleanId ? 'occasion' : 'default',
      activeBackgroundThemeId: cleanId,
      customBackgroundImage: '',
      customBackgroundVideo: ''
    });
  };

  return (
    <section
      aria-label="Background selection"
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden transition-colors"
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleImageFileUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleVideoFileUpload}
      />

      {/* Compact P3 Header Row */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Miniature swatch */}
          <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 flex items-center justify-center relative">
            {resolvedMode === 'image' && profile.customBackgroundImage ? (
              <img src={profile.customBackgroundImage} alt="" className="w-full h-full object-cover" />
            ) : resolvedMode === 'video' && profile.customBackgroundVideo?.startsWith('preset:') ? (
              <AnimatedVideoBackdrop
                variant={
                  ANIMATED_VIDEO_PRESETS.find((v) => v.id === profile.customBackgroundVideo)?.variant || 'waves'
                }
              />
            ) : resolvedMode === 'video' ? (
              <Film className="w-4 h-4 text-zinc-900 dark:text-white" />
            ) : resolvedMode === 'occasion' ? (
              <Sparkles className="w-4 h-4 text-zinc-900 dark:text-white" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-black to-zinc-400 dark:from-white dark:to-zinc-600" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
              Background
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasCustomBackground && (
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Reset background to default"
              aria-label="Reset background"
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenPicker}
            aria-expanded={isExpanded}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-950 dark:text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Change background</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable 3-Category Picker (Image | Animated Video | Occasion) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3.5">
          {/* Category Switcher */}
          <div
            role="tablist"
            aria-label="Background categories"
            className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            {[
              { id: 'image' as const, label: 'Image', icon: ImageIcon },
              { id: 'video' as const, label: 'Animated Video', icon: Film },
              { id: 'occasion' as const, label: 'Occasion', icon: Sparkles }
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(cat.id)}
                  className={`min-h-[36px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-400">
              {uploadError}
            </div>
          )}

          {/* Category 1: Image */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CURATED_IMAGE_BACKGROUNDS.map((preset) => {
                  const isActive =
                    resolvedMode === 'image' && profile.customBackgroundImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyImage(preset.url)}
                      className={`group rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-black dark:border-white ring-2 ring-black/20 dark:ring-white/25'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <div className="h-14 relative overflow-hidden" style={preset.previewStyle}>
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                        />
                        {isActive && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="px-2 py-1.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate bg-zinc-50 dark:bg-zinc-950">
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste background image URL..."
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApplyImage(imageUrlInput)}
                    disabled={!imageUrlInput.trim()}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Apply URL
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="min-h-[40px] px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Image</span>
                  </button>
                  {resolvedMode === 'image' && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      aria-label="Remove background image"
                      title="Remove image"
                      className="min-h-[40px] px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Category 2: Animated Video */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ANIMATED_VIDEO_PRESETS.map((preset) => {
                  const isActive =
                    resolvedMode === 'video' && profile.customBackgroundVideo === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyVideo(preset.id)}
                      className={`rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-black dark:border-white ring-2 ring-black/20 dark:ring-white/25'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                      }`}
                    >
                      <div className="h-14 relative overflow-hidden">
                        <AnimatedVideoBackdrop variant={preset.variant} />
                        {isActive && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950">
                        <div className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {preset.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="Paste looping MP4 / WebM video URL..."
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-950 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApplyVideo(videoUrlInput)}
                    disabled={!videoUrlInput.trim()}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Apply Video
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="min-h-[40px] px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingVideo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Video</span>
                  </button>
                  {resolvedMode === 'video' && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      aria-label="Remove background video"
                      title="Remove video"
                      className="min-h-[40px] px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Category 3: Occasion (Reuses existing BackgroundThemeGallery directly) */}
          {activeTab === 'occasion' && (
            <BackgroundThemeGallery
              profile={profile}
              isEditing={true}
              canEdit={true}
              theme={theme}
              onPreviewTheme={(t) => onPreviewOccasionTheme?.(t)}
              onUpdateActiveTheme={handleApplyOccasionTheme}
              onUpdateSavedThemes={(savedIds) => onUpdateFields({ savedBackgroundThemeIds: savedIds })}
            />
          )}
        </div>
      )}
    </section>
  );
}
